import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, In } from 'typeorm';
import { Report, ReportStatus } from './entities/report.entity';
import { CommunityVote, VoteValue } from './entities/community-vote.entity';
import { ModerationAction, ActionType } from './entities/moderation-action.entity';
import { User, UserRole } from '../users/entities/user.entity';
import { Post, PostVisibility } from '../posts/entities/post.entity';
import { CreateReportDto } from './dto/create-report.dto';
import { CastVoteDto } from './dto/cast-vote.dto';
import { ModerationActionDto } from './dto/moderation-action.dto';

@Injectable()
export class ModerationService {
  constructor(
    @InjectRepository(Report)
    private readonly reportRepo: Repository<Report>,
    @InjectRepository(CommunityVote)
    private readonly voteRepo: Repository<CommunityVote>,
    @InjectRepository(ModerationAction)
    private readonly actionRepo: Repository<ModerationAction>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Post)
    private readonly postRepo: Repository<Post>,
  ) {}

  async createReport(reporterId: string, dto: CreateReportDto): Promise<Report> {
    if (!dto.reportedPostId && !dto.reportedUserId) {
      throw new BadRequestException('Must report either a post or a user');
    }

    // Check for duplicate reports from the same user
    const existing = await this.reportRepo.findOne({
      where: {
        reporterId,
        reportedPostId: dto.reportedPostId || undefined,
        reportedUserId: dto.reportedUserId || undefined,
        status: Not(In([ReportStatus.RESOLVED_ACTIONED, ReportStatus.RESOLVED_DISMISSED])),
      },
    });
    if (existing) {
      throw new ConflictException('You already have an active report for this content');
    }

    const report = this.reportRepo.create({
      reporterId,
      reportedPostId: dto.reportedPostId || null,
      reportedUserId: dto.reportedUserId || null,
      category: dto.category,
      description: dto.description || null,
    });

    return this.reportRepo.save(report);
  }

  async getQueue(page = 1, limit = 20): Promise<Report[]> {
    return this.reportRepo.find({
      where: [
        { status: ReportStatus.PENDING },
        { status: ReportStatus.UNDER_REVIEW },
        { status: ReportStatus.COMMUNITY_VOTE },
      ],
      relations: ['reporter', 'reportedPost', 'reportedUser', 'votes'],
      order: { createdAt: 'ASC' },
      skip: (page - 1) * limit,
      take: limit,
    });
  }

  async getReportForVoting(reportId: string): Promise<Report> {
    const report = await this.reportRepo.findOne({
      where: { id: reportId, status: ReportStatus.COMMUNITY_VOTE },
      relations: ['reportedPost', 'reportedUser'],
    });
    if (!report) {
      throw new NotFoundException('Report not found or not available for voting');
    }
    return report;
  }

  /**
   * Cast a community vote. Select 10 random eligible voters, require 70% threshold.
   */
  async castVote(voterId: string, dto: CastVoteDto): Promise<{ voteCounted: boolean; resolved: boolean }> {
    const report = await this.reportRepo.findOne({
      where: { id: dto.reportId },
      relations: ['votes'],
    });
    if (!report) throw new NotFoundException('Report not found');

    // Cannot vote on your own report
    if (report.reporterId === voterId) {
      throw new ForbiddenException('Cannot vote on your own report');
    }
    // Cannot vote if you are the reported user
    if (report.reportedUserId === voterId) {
      throw new ForbiddenException('Cannot vote on a report about yourself');
    }

    // Check if already voted
    const existingVote = await this.voteRepo.findOne({
      where: { reportId: dto.reportId, voterId },
    });
    if (existingVote) throw new ConflictException('You have already voted on this report');

    // Move to community_vote status if still pending
    if (report.status === ReportStatus.PENDING || report.status === ReportStatus.UNDER_REVIEW) {
      report.status = ReportStatus.COMMUNITY_VOTE;
      await this.reportRepo.save(report);
    }

    // Save the vote
    const vote = this.voteRepo.create({
      reportId: dto.reportId,
      voterId,
      vote: dto.vote,
    });
    await this.voteRepo.save(vote);

    // Check if we have enough votes (10) to resolve
    const allVotes = await this.voteRepo.find({ where: { reportId: dto.reportId } });

    if (allVotes.length >= 10) {
      return { voteCounted: true, resolved: await this.resolveByVotes(report, allVotes) };
    }

    return { voteCounted: true, resolved: false };
  }

  /**
   * Resolve a report based on community votes.
   * 70% threshold for "violates" = action needed.
   */
  private async resolveByVotes(report: Report, votes: CommunityVote[]): Promise<boolean> {
    const violatesCount = votes.filter((v) => v.vote === VoteValue.VIOLATES).length;
    const noViolationCount = votes.filter((v) => v.vote === VoteValue.NO_VIOLATION).length;
    const decisiveVotes = violatesCount + noViolationCount;

    if (decisiveVotes === 0) return false;

    const violatesRatio = violatesCount / decisiveVotes;

    if (violatesRatio >= 0.7) {
      // Community says it violates -- escalate for mod action
      report.status = ReportStatus.RESOLVED_ESCALATED;
      await this.reportRepo.save(report);
      return true;
    } else if (noViolationCount / decisiveVotes >= 0.7) {
      // Community says no violation
      report.status = ReportStatus.RESOLVED_DISMISSED;
      await this.reportRepo.save(report);
      return true;
    }

    // No clear consensus -- escalate to moderator
    report.status = ReportStatus.UNDER_REVIEW;
    await this.reportRepo.save(report);
    return false;
  }

  /**
   * Moderator/admin takes action on a report.
   * Applies enforcement tiers and logs publicly.
   */
  async takeAction(moderatorId: string, dto: ModerationActionDto): Promise<ModerationAction> {
    const report = await this.reportRepo.findOne({ where: { id: dto.reportId } });
    if (!report) throw new NotFoundException('Report not found');

    const action = this.actionRepo.create({
      reportId: dto.reportId,
      moderatorId,
      targetUserId: dto.targetUserId || report.reportedUserId,
      targetPostId: dto.targetPostId || report.reportedPostId,
      action: dto.action,
      reason: dto.reason,
      isPublic: dto.isPublic !== undefined ? dto.isPublic : true,
    });

    const saved = await this.actionRepo.save(action);

    // Apply the enforcement
    await this.applyEnforcement(dto.action, action.targetUserId, action.targetPostId);

    // Mark report as resolved
    report.status = ReportStatus.RESOLVED_ACTIONED;
    await this.reportRepo.save(report);

    return saved;
  }

  private async applyEnforcement(
    actionType: ActionType,
    targetUserId: string | null,
    targetPostId: string | null,
  ): Promise<void> {
    switch (actionType) {
      case ActionType.CONTENT_REMOVAL:
        if (targetPostId) {
          await this.postRepo.update(targetPostId, { isDeleted: true });
        }
        break;

      case ActionType.VISIBILITY_REDUCTION:
        if (targetPostId) {
          await this.postRepo.update(targetPostId, { visibility: PostVisibility.REDUCED });
        }
        break;

      case ActionType.TEMPORARY_SUSPENSION:
        if (targetUserId) {
          const suspendedUntil = new Date();
          suspendedUntil.setDate(suspendedUntil.getDate() + 7); // 7-day default
          await this.userRepo.update(targetUserId, {
            isSuspended: true,
            suspensionReason: 'Temporary suspension due to community guidelines violation',
            suspendedUntil,
          });
        }
        break;

      case ActionType.PERMANENT_BAN:
        if (targetUserId) {
          await this.userRepo.update(targetUserId, {
            isSuspended: true,
            suspensionReason: 'Permanent ban due to severe or repeated violations',
            suspendedUntil: null,
          });
        }
        break;

      case ActionType.APPEAL_GRANTED:
        if (targetUserId) {
          await this.userRepo.update(targetUserId, {
            isSuspended: false,
            suspensionReason: null,
            suspendedUntil: null,
          });
        }
        if (targetPostId) {
          await this.postRepo.update(targetPostId, {
            isDeleted: false,
            visibility: PostVisibility.PUBLIC,
          });
        }
        break;

      case ActionType.WARNING:
      case ActionType.NO_ACTION:
      default:
        // No enforcement action needed, logged only
        break;
    }
  }

  /**
   * Public moderation log -- only actions marked as public.
   */
  async getPublicLog(page = 1, limit = 20): Promise<ModerationAction[]> {
    return this.actionRepo.find({
      where: { isPublic: true },
      relations: ['report'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
  }
}
