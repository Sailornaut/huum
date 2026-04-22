import {
  Entity,
  PrimaryColumn,
  Column,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity('user_preferences')
export class UserPreference {
  @PrimaryColumn({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @Column({ name: 'perspective_slider', type: 'float', default: 0.3 })
  perspectiveSlider!: number;

  @Column({ name: 'show_sensitive', default: false })
  showSensitive!: boolean;

  @Column({ name: 'notification_emails', default: true })
  notificationEmails!: boolean;

  @Column({ default: 'system' })
  theme!: string;

  @OneToOne(() => User, (user) => user.preferences, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;
}
