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
import { Like } from './like.entity';
import { Comment } from '../../comments/entities/comment.entity';
import { PostTag } from './post-tag.entity';

export enum PostVisibility {
  PUBLIC = 'public',
  REDUCED = 'reduced',
  HIDDEN = 'hidden',
}

export enum MediaType {
  IMAGE = 'image',
  VIDEO = 'video',
}

@Entity('posts')
export class Post {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'author_id', type: 'uuid' })
  authorId!: string;

  @Column({ type: 'text' })
  content!: string;

  @Column({ name: 'media_urls', type: 'text', array: true, default: '{}' })
  mediaUrls!: string[];

  @Column({ name: 'media_type', type: 'enum', enum: MediaType, nullable: true })
  mediaType!: MediaType | null;

  @Column({ name: 'parent_post_id', type: 'uuid', nullable: true })
  parentPostId!: string | null;

  @Column({ name: 'repost_of_id', type: 'uuid', nullable: true })
  repostOfId!: string | null;

  @Column({ name: 'like_count', default: 0 })
  likeCount!: number;

  @Column({ name: 'comment_count', default: 0 })
  commentCount!: number;

  @Column({ name: 'repost_count', default: 0 })
  repostCount!: number;

  @Column({ type: 'enum', enum: PostVisibility, default: PostVisibility.PUBLIC })
  visibility!: PostVisibility;

  @Column({ name: 'is_deleted', default: false })
  isDeleted!: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  // Relations

  @ManyToOne(() => User, (user) => user.posts, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'author_id' })
  author!: User;

  @ManyToOne(() => Post, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'parent_post_id' })
  parentPost!: Post | null;

  @ManyToOne(() => Post, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'repost_of_id' })
  repostOf!: Post | null;

  @OneToMany(() => Post, (post) => post.parentPost)
  replies!: Post[];

  @OneToMany(() => Like, (like) => like.post)
  likes!: Like[];

  @OneToMany(() => Comment, (comment) => comment.post)
  comments!: Comment[];

  @OneToMany(() => PostTag, (postTag) => postTag.post)
  postTags!: PostTag[];
}
