import { Module } from '@nestjs/common';
import { FeedController } from './feed.controller';
import { FeedService } from './feed.service';
import { UsersModule } from '../users/users.module';
import { PostsModule } from '../posts/posts.module';

@Module({
  imports: [UsersModule, PostsModule],
  controllers: [FeedController],
  providers: [FeedService],
})
export class FeedModule {}
