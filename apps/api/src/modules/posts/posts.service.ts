import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Post, PostVisibility, MediaType } from './entities/post.entity';
import { Like } from './entities/like.entity';
import { PostTag } from './entities/post-tag.entity';
import { CreatePostDto } from './dto/create-post.dto';

@Injectable()
export class PostsService {
  constructor(
    @InjectRepository(Post)
    private readonly postRepo: Repository<Post>,
    @InjectRepository(Like)
    private readonly likeRepo: Repository<Like>,
    @InjectRepository(PostTag)
    private readonly postTagRepo: Repository<PostTag>,
  ) {}

  async create(authorId: string, dto: CreatePostDto): Promise<Post> {
    const post = this.postRepo.create({
      authorId,
      content: dto.content,
      mediaUrls: dto.mediaUrls || [],
      mediaType: dto.mediaType || null,
      parentPostId: dto.parentPostId || null,
    });

    const saved = await this.postRepo.save(post);

    // If this is a reply, increment parent's comment count
    if (dto.parentPostId) {
      await this.postRepo.increment({ id: dto.parentPostId }, 'commentCount', 1);
    }

    // Associate tags
    if (dto.tagIds && dto.tagIds.length > 0) {
      const postTags = dto.tagIds.map((tagId) =>
        this.postTagRepo.create({ postId: saved.id, tagId }),
      );
      await this.postTagRepo.save(postTags);
    }

    return this.findById(saved.id);
  }

  async findById(id: string): Promise<Post> {
    const post = await this.postRepo.findOne({
      where: { id, isDeleted: false },
      relations: ['author', 'repostOf', 'repostOf.author'],
    });
    if (!post) throw new NotFoundException('Post not found');
    return post;
  }

  async delete(postId: string, userId: string): Promise<void> {
    const post = await this.findById(postId);
    if (post.authorId !== userId) {
      throw new ForbiddenException('You can only delete your own posts');
    }
    post.isDeleted = true;
    await this.postRepo.save(post);
  }

  async like(userId: string, postId: string): Promise<void> {
    await this.findById(postId); // ensure post exists

    const existing = await this.likeRepo.findOne({
      where: { userId, postId },
    });
    if (existing) throw new ConflictException('Already liked');

    const like = this.likeRepo.create({ userId, postId });
    await this.likeRepo.save(like);
    await this.postRepo.increment({ id: postId }, 'likeCount', 1);
  }

  async unlike(userId: string, postId: string): Promise<void> {
    const result = await this.likeRepo.delete({ userId, postId });
    if (result.affected === 0) {
      throw new NotFoundException('Like not found');
    }
    await this.postRepo.decrement({ id: postId }, 'likeCount', 1);
  }

  async repost(userId: string, postId: string): Promise<Post> {
    const original = await this.findById(postId);

    const repost = this.postRepo.create({
      authorId: userId,
      content: '',
      repostOfId: original.id,
      visibility: PostVisibility.PUBLIC,
    });
    const saved = await this.postRepo.save(repost);

    await this.postRepo.increment({ id: postId }, 'repostCount', 1);

    return this.findById(saved.id);
  }

  async getThread(postId: string): Promise<{ root: Post; replies: Post[] }> {
    const root = await this.findById(postId);

    const replies = await this.postRepo.find({
      where: { parentPostId: postId, isDeleted: false },
      relations: ['author'],
      order: { createdAt: 'ASC' },
    });

    return { root, replies };
  }

  async getPostsByAuthor(authorId: string, page = 1, limit = 20): Promise<Post[]> {
    return this.postRepo.find({
      where: { authorId, isDeleted: false },
      relations: ['author', 'repostOf', 'repostOf.author'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
  }

  async getPostsByIds(ids: string[]): Promise<Post[]> {
    if (ids.length === 0) return [];
    return this.postRepo
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.author', 'author')
      .where('post.id IN (:...ids)', { ids })
      .andWhere('post.is_deleted = false')
      .andWhere('post.visibility = :vis', { vis: PostVisibility.PUBLIC })
      .getMany();
  }

  async getTrendingPosts(limit = 20): Promise<Post[]> {
    return this.postRepo
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.author', 'author')
      .where('post.is_deleted = false')
      .andWhere('post.visibility = :vis', { vis: PostVisibility.PUBLIC })
      .andWhere('post.created_at > :since', {
        since: new Date(Date.now() - 24 * 60 * 60 * 1000),
      })
      .orderBy(
        '(post.like_count * 1 + post.comment_count * 2 + post.repost_count * 1.5)',
        'DESC',
      )
      .take(limit)
      .getMany();
  }

  async getPostsNotByUsers(excludeUserIds: string[], limit = 20): Promise<Post[]> {
    const qb = this.postRepo
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.author', 'author')
      .where('post.is_deleted = false')
      .andWhere('post.visibility = :vis', { vis: PostVisibility.PUBLIC });

    if (excludeUserIds.length > 0) {
      qb.andWhere('post.author_id NOT IN (:...excludeUserIds)', { excludeUserIds });
    }

    return qb
      .orderBy('RANDOM()')
      .take(limit)
      .getMany();
  }

  async getFollowedPosts(followedIds: string[], limit = 50): Promise<Post[]> {
    if (followedIds.length === 0) return [];
    return this.postRepo
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.author', 'author')
      .where('post.author_id IN (:...followedIds)', { followedIds })
      .andWhere('post.is_deleted = false')
      .andWhere('post.visibility = :vis', { vis: PostVisibility.PUBLIC })
      .orderBy('post.created_at', 'DESC')
      .take(limit)
      .getMany();
  }
}
