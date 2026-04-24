import {
  Controller,
  Get,
  Post as HttpPost,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiTags, ApiQuery } from '@nestjs/swagger';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

@ApiTags('posts')
@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @HttpPost()
  async create(@CurrentUser() user: User, @Body() dto: CreatePostDto) {
    return this.postsService.create(user.id, dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @HttpPost('upload')
  @UseInterceptors(FileInterceptor('file'))
  async upload(@UploadedFile() file: Express.Multer.File) {
    return this.postsService.uploadMedia(file);
  }

  @Get(':id')
  async getPost(@Param('id') id: string) {
    return this.postsService.findById(id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async deletePost(@CurrentUser() user: User, @Param('id') id: string) {
    await this.postsService.delete(id, user.id);
    return { message: 'Post deleted' };
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @HttpPost(':id/like')
  async like(@CurrentUser() user: User, @Param('id') postId: string) {
    await this.postsService.like(user.id, postId);
    return { message: 'Post liked' };
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Delete(':id/like')
  async unlike(@CurrentUser() user: User, @Param('id') postId: string) {
    await this.postsService.unlike(user.id, postId);
    return { message: 'Post unliked' };
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @HttpPost(':id/repost')
  async repost(@CurrentUser() user: User, @Param('id') postId: string) {
    return this.postsService.repost(user.id, postId);
  }

  @Get(':id/thread')
  async getThread(@Param('id') postId: string) {
    return this.postsService.getThread(postId);
  }

  @Get('user/:userId')
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async getByUser(
    @Param('userId') userId: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.postsService.getPostsByAuthor(userId, page, limit);
  }
}
