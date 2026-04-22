import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Report } from './report.entity';

export enum ActionType {
  WARNING = 'warning',
  VISIBILITY_REDUCTION = 'visibility_reduction',
  TEMPORARY_SUSPENSION = 'temporary_suspension',
  PERMANENT_BAN = 'permanent_ban',
  CONTENT_REMOVAL = 'content_removal',
  NO_ACTION = 'no_action',
  APPEAL_GRANTED = 'appeal_granted',
}

@Entity('moderation_actions')
export class ModerationAction {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'report_id', type: 'uuid' })
  reportId!: string;

  @Column({ name: 'moderator_id', type: 'uuid' })
  moderatorId!: string;

  @Column({ name: 'target_user_id', type: 'uuid', nullable: true })
  targetUserId!: string | null;

  @Column({ name: 'target_post_id', type: 'uuid', nullable: true })
  targetPostId!: string | null;

  @Column({ type: 'enum', enum: ActionType })
  action!: ActionType;

  @Column({ type: 'text' })
  reason!: string;

  @Column({ name: 'is_public', default: true })
  isPublic!: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  // Relations

  @ManyToOne(() => Report, (report) => report.actions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'report_id' })
  report!: Report;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'moderator_id' })
  moderator!: User;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'target_user_id' })
  targetUser!: User | null;
}
