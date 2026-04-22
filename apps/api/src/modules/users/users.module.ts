import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { Follow } from './entities/follow.entity';
import { BeliefTag } from './entities/belief-tag.entity';
import { UserPreference } from './entities/user-preference.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Follow, BeliefTag, UserPreference])],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
