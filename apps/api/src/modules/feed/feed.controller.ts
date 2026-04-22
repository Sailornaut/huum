import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiQuery } from '@nestjs/swagger';
import { FeedService } from './feed.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

@ApiTags('feed')
@Controller('feed')
export class FeedController {
  constructor(private readonly feedService: FeedService) {}

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get()
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async getFeed(
    @CurrentUser() user: User,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.feedService.getFeed(user.id, page, limit);
  }

  @Get('trending')
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async getTrending(@Query('page') page = 1, @Query('limit') limit = 20) {
    return this.feedService.getTrending(page, limit);
  }

  @Get('explore')
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async getExplore(@Query('page') page = 1, @Query('limit') limit = 20) {
    return this.feedService.getExplore(page, limit);
  }
}
