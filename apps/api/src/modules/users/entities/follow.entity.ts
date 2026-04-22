import {
  Entity,
  PrimaryColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity('follows')
export class Follow {
  @PrimaryColumn({ name: 'follower_id', type: 'uuid' })
  followerId!: string;

  @PrimaryColumn({ name: 'following_id', type: 'uuid' })
  followingId!: string;

  @ManyToOne(() => User, (user) => user.following, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'follower_id' })
  follower!: User;

  @ManyToOne(() => User, (user) => user.followers, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'following_id' })
  following!: User;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
