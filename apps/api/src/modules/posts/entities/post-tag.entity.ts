import { Entity, PrimaryColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Post } from './post.entity';
import { BeliefTag } from '../../users/entities/belief-tag.entity';

@Entity('post_tags')
export class PostTag {
  @PrimaryColumn({ name: 'post_id', type: 'uuid' })
  postId!: string;

  @PrimaryColumn({ name: 'tag_id', type: 'int' })
  tagId!: number;

  @ManyToOne(() => Post, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'post_id' })
  post!: Post;

  @ManyToOne(() => BeliefTag, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tag_id' })
  tag!: BeliefTag;
}
