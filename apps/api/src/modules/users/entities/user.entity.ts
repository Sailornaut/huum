import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  OneToOne,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { Post } from '../../posts/entities/post.entity';
import { Like } from '../../posts/entities/like.entity';
import { Comment } from '../../comments/entities/comment.entity';
import { Follow } from './follow.entity';
import { BeliefTag } from './belief-tag.entity';
import { UserPreference } from './user-preference.entity';

export enum UserRole {
  USER = 'user',
  MODERATOR = 'moderator',
  ADMIN = 'admin',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  email!: string;

  @Column({ unique: true })
  username!: string;

  @Column({ name: 'display_name' })
  displayName!: string;

  @Column({ name: 'password_hash', type: 'varchar', length: 255, nullable: true })
  passwordHash!: string | null;

  @Column({ type: 'text', nullable: true })
  bio!: string | null;

  @Column({ name: 'avatar_url', type: 'varchar', length: 500, nullable: true })
  avatarUrl!: string | null;

  @Column({ name: 'oauth_provider', type: 'varchar', length: 50, nullable: true })
  oauthProvider!: string | null;

  @Column({ name: 'oauth_id', type: 'varchar', length: 255, nullable: true })
  oauthId!: string | null;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.USER })
  role!: UserRole;

  @Column({ name: 'is_verified', default: false })
  isVerified!: boolean;

  @Column({ name: 'is_suspended', default: false })
  isSuspended!: boolean;

  @Column({ name: 'suspension_reason', type: 'text', nullable: true })
  suspensionReason!: string | null;

  @Column({ name: 'suspended_until', type: 'timestamptz', nullable: true })
  suspendedUntil!: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  // Relations

  @OneToMany(() => Post, (post) => post.author)
  posts!: Post[];

  @OneToMany(() => Like, (like) => like.user)
  likes!: Like[];

  @OneToMany(() => Comment, (comment) => comment.author)
  comments!: Comment[];

  @OneToMany(() => Follow, (follow) => follow.follower)
  following!: Follow[];

  @OneToMany(() => Follow, (follow) => follow.following)
  followers!: Follow[];

  @ManyToMany(() => BeliefTag, (tag) => tag.users)
  @JoinTable({
    name: 'user_belief_tags',
    joinColumn: { name: 'user_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'tag_id', referencedColumnName: 'id' },
  })
  beliefTags!: BeliefTag[];

  @OneToOne(() => UserPreference, (pref) => pref.user)
  preferences!: UserPreference;
}
