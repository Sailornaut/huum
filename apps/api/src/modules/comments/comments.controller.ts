import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

@ApiTags('comments')
@Controller('comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post()
  async create(@CurrentUser() user: User, @Body() dto: CreateCommentDto) {
    return this.commentsService.create(user.id, dto);
  }

  @Get('post/:postId')
  async getByPost(@Param('postId') postId: string) {
    return this.commentsService.getByPost(postId);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async delete(@CurrentUser() user: User, @Param('id') id: string) {
    await this.commentsService.delete(id, user.id);
    return { message: 'Comment deleted' };
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post(':id/like')
  async like(@Param('id') id: string) {
    await this.commentsService.likeComment(id);
    return { message: 'Comment liked' };
  }
}
