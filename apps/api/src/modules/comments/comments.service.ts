import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Comment } from './entities/comment.entity';
import { CreateCommentDto } from './dto/create-comment.dto';

export interface ThreadedComment extends Comment {
  children: ThreadedComment[];
}

@Injectable()
export class CommentsService {
  constructor(
    @InjectRepository(Comment)
    private readonly commentRepo: Repository<Comment>,
  ) {}

  async create(authorId: string, dto: CreateCommentDto): Promise<Comment> {
    let depth = 0;

    if (dto.parentCommentId) {
      const parent = await this.commentRepo.findOne({
        where: { id: dto.parentCommentId },
      });
      if (!parent) throw new NotFoundException('Parent comment not found');
      depth = parent.depth + 1;
    }

    const comment = this.commentRepo.create({
      postId: dto.postId,
      authorId,
      parentCommentId: dto.parentCommentId || null,
      content: dto.content,
      depth,
    });

    return this.commentRepo.save(comment);
  }

  async getByPost(postId: string): Promise<ThreadedComment[]> {
    const allComments = await this.commentRepo.find({
      where: { postId, isDeleted: false },
      relations: ['author'],
      order: { createdAt: 'ASC' },
    });

    return this.buildTree(allComments);
  }

  private buildTree(comments: Comment[]): ThreadedComment[] {
    const map = new Map<string, ThreadedComment>();
    const roots: ThreadedComment[] = [];

    // Initialize all comments with empty children arrays
    for (const comment of comments) {
      map.set(comment.id, { ...comment, children: [] } as ThreadedComment);
    }

    // Build parent-child relationships
    for (const comment of comments) {
      const node = map.get(comment.id)!;
      if (comment.parentCommentId && map.has(comment.parentCommentId)) {
        map.get(comment.parentCommentId)!.children.push(node);
      } else {
        roots.push(node);
      }
    }

    return roots;
  }

  async delete(commentId: string, userId: string): Promise<void> {
    const comment = await this.commentRepo.findOne({
      where: { id: commentId },
    });
    if (!comment) throw new NotFoundException('Comment not found');
    if (comment.authorId !== userId) {
      throw new ForbiddenException('You can only delete your own comments');
    }

    comment.isDeleted = true;
    comment.content = '[deleted]';
    await this.commentRepo.save(comment);
  }

  async likeComment(commentId: string): Promise<void> {
    const comment = await this.commentRepo.findOne({
      where: { id: commentId, isDeleted: false },
    });
    if (!comment) throw new NotFoundException('Comment not found');

    await this.commentRepo.increment({ id: commentId }, 'likeCount', 1);
  }
}
