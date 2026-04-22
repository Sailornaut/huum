import {
  Controller,
  Get,
  Patch,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiQuery } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdatePreferencesDto } from './dto/update-preferences.dto';
import { User } from './entities/user.entity';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get(':username')
  async getProfile(@Param('username') username: string) {
    return this.usersService.getProfile(username);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Patch('me')
  async updateProfile(@CurrentUser() user: User, @Body() dto: UpdateProfileDto) {
    return this.usersService.updateProfile(user.id, dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post(':id/follow')
  async follow(@CurrentUser() user: User, @Param('id') targetId: string) {
    await this.usersService.follow(user.id, targetId);
    return { message: 'Followed successfully' };
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Delete(':id/follow')
  async unfollow(@CurrentUser() user: User, @Param('id') targetId: string) {
    await this.usersService.unfollow(user.id, targetId);
    return { message: 'Unfollowed successfully' };
  }

  @Get(':id/followers')
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async getFollowers(
    @Param('id') userId: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.usersService.getFollowers(userId, page, limit);
  }

  @Get(':id/following')
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async getFollowing(
    @Param('id') userId: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.usersService.getFollowing(userId, page, limit);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Patch('me/preferences')
  async updatePreferences(@CurrentUser() user: User, @Body() dto: UpdatePreferencesDto) {
    return this.usersService.updatePreferences(user.id, dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('me/preferences')
  async getPreferences(@CurrentUser() user: User) {
    return this.usersService.getPreferences(user.id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('me/belief-tags')
  async setBeliefTags(@CurrentUser() user: User, @Body('tagIds') tagIds: string[]) {
    return this.usersService.setBeliefTags(user.id, tagIds);
  }
}
