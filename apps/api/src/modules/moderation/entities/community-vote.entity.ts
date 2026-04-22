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

export enum VoteValue {
  VIOLATES = 'violates',
  NO_VIOLATION = 'no_violation',
  UNSURE = 'unsure',
}

@Entity('community_votes')
export class CommunityVote {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'report_id', type: 'uuid' })
  reportId!: string;

  @Column({ name: 'voter_id', type: 'uuid' })
  voterId!: string;

  @Column({ type: 'enum', enum: VoteValue })
  vote!: VoteValue;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  // Relations

  @ManyToOne(() => Report, (report) => report.votes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'report_id' })
  report!: Report;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'voter_id' })
  voter!: User;
}
