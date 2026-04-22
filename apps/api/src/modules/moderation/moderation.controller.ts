import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiQuery } from '@nestjs/swagger';
import { ModerationService } from './moderation.service';
import { CreateReportDto } from './dto/create-report.dto';
import { CastVoteDto } from './dto/cast-vote.dto';
import { ModerationActionDto } from './dto/moderation-action.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { User, UserRole } from '../users/entities/user.entity';

@ApiTags('moderation')
@Controller('moderation')
export class ModerationController {
  constructor(private readonly moderationService: ModerationService) {}

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('reports')
  async createReport(@CurrentUser() user: User, @Body() dto: CreateReportDto) {
    return this.moderationService.createReport(user.id, dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.MODERATOR, UserRole.ADMIN)
  @Get('queue')
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async getQueue(@Query('page') page = 1, @Query('limit') limit = 20) {
    return this.moderationService.getQueue(page, limit);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('reports/:id/vote')
  async getReportForVoting(@Param('id') reportId: string) {
    return this.moderationService.getReportForVoting(reportId);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('votes')
  async castVote(@CurrentUser() user: User, @Body() dto: CastVoteDto) {
    return this.moderationService.castVote(user.id, dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.MODERATOR, UserRole.ADMIN)
  @Post('actions')
  async takeAction(@CurrentUser() user: User, @Body() dto: ModerationActionDto) {
    return this.moderationService.takeAction(user.id, dto);
  }

  @Get('log')
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async getPublicLog(@Query('page') page = 1, @Query('limit') limit = 20) {
    return this.moderationService.getPublicLog(page, limit);
  }
}
