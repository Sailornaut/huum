import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ModerationController } from './moderation.controller';
import { ModerationService } from './moderation.service';
import { Report } from './entities/report.entity';
import { CommunityVote } from './entities/community-vote.entity';
import { ModerationAction } from './entities/moderation-action.entity';
import { User } from '../users/entities/user.entity';
import { Post } from '../posts/entities/post.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Report, CommunityVote, ModerationAction, User, Post]),
  ],
  controllers: [ModerationController],
  providers: [ModerationService],
  exports: [ModerationService],
})
export class ModerationModule {}
