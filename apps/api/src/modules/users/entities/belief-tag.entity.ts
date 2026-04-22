import { Entity, PrimaryGeneratedColumn, Column, ManyToMany } from 'typeorm';
import { User } from './user.entity';

@Entity('belief_tags')
export class BeliefTag {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  name!: string;

  @Column({ unique: true })
  slug!: string;

  @ManyToMany(() => User, (user) => user.beliefTags)
  users!: User[];
}
