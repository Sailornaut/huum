import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Post } from '../../posts/entities/post.entity';
import { CommunityVote } from './community-vote.entity';
import { ModerationAction } from './moderation-action.entity';

export enum ReportCategory {
  HATE_SPEECH = 'hate_speech',
  MISINFORMATION = 'misinformation',
  HARASSMENT = 'harassment',
  SPAM = 'spam',
  VIOLENCE = 'violence',
  ILLEGAL_CONTENT = 'illegal_content',
  OTHER = 'other',
}

export enum ReportStatus {
  PENDING = 'pending',
  UNDER_REVIEW = 'under_review',
  COMMUNITY_VOTE = 'community_vote',
  RESOLVED_ACTIONED = 'resolved_actioned',
  RESOLVED_DISMISSED = 'resolved_dismissed',
  RESOLVED_ESCALATED = 'resolved_escalated',
}

@Entity('reports')
export class Report {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'reporter_id', type: 'uuid' })
  reporterId!: string;

  @Column({ name: 'reported_post_id', type: 'uuid', nullable: true })
  reportedPostId!: string | null;

  @Column({ name: 'reported_user_id', type: 'uuid', nullable: true })
  reportedUserId!: string | null;

  @Column({ type: 'enum', enum: ReportCategory })
  category!: ReportCategory;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ type: 'enum', enum: ReportStatus, default: ReportStatus.PENDING })
  status!: ReportStatus;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  // Relations

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'reporter_id' })
  reporter!: User;

  @ManyToOne(() => Post, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'reported_post_id' })
  reportedPost!: Post | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'reported_user_id' })
  reportedUser!: User | null;

  @OneToMany(() => CommunityVote, (vote) => vote.report)
  votes!: CommunityVote[];

  @OneToMany(() => ModerationAction, (action) => action.report)
  actions!: ModerationAction[];
}
