import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Post } from '../../posts/entities/post.entity';

@Entity('comments')
export class Comment {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'post_id', type: 'uuid' })
  postId!: string;

  @Column({ name: 'author_id', type: 'uuid' })
  authorId!: string;

  @Column({ name: 'parent_comment_id', type: 'uuid', nullable: true })
  parentCommentId!: string | null;

  @Column({ type: 'text' })
  content!: string;

  @Column({ name: 'like_count', default: 0 })
  likeCount!: number;

  @Column({ type: 'int', default: 0 })
  depth!: number;

  @Column({ name: 'is_deleted', default: false })
  isDeleted!: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  // Relations

  @ManyToOne(() => Post, (post) => post.comments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'post_id' })
  post!: Post;

  @ManyToOne(() => User, (user) => user.comments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'author_id' })
  author!: User;

  @ManyToOne(() => Comment, (comment) => comment.children, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'parent_comment_id' })
  parentComment!: Comment | null;

  @OneToMany(() => Comment, (comment) => comment.parentComment)
  children!: Comment[];
}
