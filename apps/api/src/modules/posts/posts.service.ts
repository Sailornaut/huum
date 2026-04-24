import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { randomUUID } from 'crypto';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { Post, PostVisibility, MediaType } from './entities/post.entity';
import { Like } from './entities/like.entity';
import { PostTag } from './entities/post-tag.entity';
import { CreatePostDto } from './dto/create-post.dto';
import { BeliefTag } from '../users/entities/belief-tag.entity';

@Injectable()
export class PostsService {
  private readonly s3Client: S3Client;

  constructor(
    @InjectRepository(Post)
    private readonly postRepo: Repository<Post>,
    @InjectRepository(Like)
    private readonly likeRepo: Repository<Like>,
    @InjectRepository(PostTag)
    private readonly postTagRepo: Repository<PostTag>,
    @InjectRepository(BeliefTag)
    private readonly beliefTagRepo: Repository<BeliefTag>,
    private readonly configService: ConfigService,
  ) {
    this.s3Client = new S3Client({
      region:
        this.configService.get<string>('S3_REGION') ||
        this.configService.get<string>('AWS_REGION') ||
        'us-east-1',
      endpoint:
        this.configService.get<string>('S3_ENDPOINT') ||
        this.configService.get<string>('AWS_S3_ENDPOINT'),
      forcePathStyle: Boolean(
        this.configService.get<string>('S3_ENDPOINT') ||
          this.configService.get<string>('AWS_S3_ENDPOINT'),
      ),
      credentials:
        this.configService.get<string>('S3_ACCESS_KEY') ||
        this.configService.get<string>('AWS_ACCESS_KEY_ID')
          ? {
              accessKeyId:
                this.configService.get<string>('S3_ACCESS_KEY') ||
                this.configService.get<string>('AWS_ACCESS_KEY_ID') ||
                '',
              secretAccessKey:
                this.configService.get<string>('S3_SECRET_KEY') ||
                this.configService.get<string>('AWS_SECRET_ACCESS_KEY') ||
                '',
            }
          : undefined,
    });
  }

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
    const resolvedTags = await this.resolveTags(dto);
    if (resolvedTags.length > 0) {
      const postTags = resolvedTags.map((tag) =>
        this.postTagRepo.create({ postId: saved.id, tagId: tag.id }),
      );
      await this.postTagRepo.save(postTags);
    }

    return this.findById(saved.id);
  }

  async findById(id: string): Promise<Post> {
    const post = await this.postRepo.findOne({
      where: { id, isDeleted: false },
      relations: ['author', 'repostOf', 'repostOf.author', 'postTags', 'postTags.tag'],
    });
    if (!post) throw new NotFoundException('Post not found');
    return this.attachTags(post);
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
    const posts = await this.postRepo.find({
      where: { authorId, isDeleted: false },
      relations: ['author', 'repostOf', 'repostOf.author', 'postTags', 'postTags.tag'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return posts.map((post) => this.attachTags(post));
  }

  async getPostsByIds(ids: string[]): Promise<Post[]> {
    if (ids.length === 0) return [];
    const posts = await this.postRepo
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.author', 'author')
      .leftJoinAndSelect('post.postTags', 'postTags')
      .leftJoinAndSelect('postTags.tag', 'tag')
      .where('post.id IN (:...ids)', { ids })
      .andWhere('post.is_deleted = false')
      .andWhere('post.visibility = :vis', { vis: PostVisibility.PUBLIC })
      .getMany();
    return posts.map((post) => this.attachTags(post));
  }

  async getTrendingPosts(limit = 20): Promise<Post[]> {
    const posts = await this.postRepo
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.author', 'author')
      .leftJoinAndSelect('post.postTags', 'postTags')
      .leftJoinAndSelect('postTags.tag', 'tag')
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
    return posts.map((post) => this.attachTags(post));
  }

  async getPostsNotByUsers(excludeUserIds: string[], limit = 20): Promise<Post[]> {
    const qb = this.postRepo
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.author', 'author')
      .leftJoinAndSelect('post.postTags', 'postTags')
      .leftJoinAndSelect('postTags.tag', 'tag')
      .where('post.is_deleted = false')
      .andWhere('post.visibility = :vis', { vis: PostVisibility.PUBLIC });

    if (excludeUserIds.length > 0) {
      qb.andWhere('post.author_id NOT IN (:...excludeUserIds)', { excludeUserIds });
    }

    const posts = await qb
      .orderBy('RANDOM()')
      .take(limit)
      .getMany();
    return posts.map((post) => this.attachTags(post));
  }

  async getFollowedPosts(followedIds: string[], limit = 50): Promise<Post[]> {
    if (followedIds.length === 0) return [];
    const posts = await this.postRepo
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.author', 'author')
      .leftJoinAndSelect('post.postTags', 'postTags')
      .leftJoinAndSelect('postTags.tag', 'tag')
      .where('post.author_id IN (:...followedIds)', { followedIds })
      .andWhere('post.is_deleted = false')
      .andWhere('post.visibility = :vis', { vis: PostVisibility.PUBLIC })
      .orderBy('post.created_at', 'DESC')
      .take(limit)
      .getMany();
    return posts.map((post) => this.attachTags(post));
  }

  async uploadMedia(
    file: Express.Multer.File,
  ): Promise<{ url: string; mediaType: MediaType }> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    const bucket =
      this.configService.get<string>('S3_BUCKET') ||
      this.configService.get<string>('AWS_S3_BUCKET');
    if (!bucket) {
      throw new BadRequestException('Media storage is not configured');
    }

    const mediaType = this.getMediaTypeFromMime(file.mimetype);
    if (!mediaType) {
      throw new BadRequestException('Only image and video uploads are supported');
    }

    const extension = file.originalname.includes('.')
      ? file.originalname.split('.').pop()
      : undefined;
    const key = `posts/${randomUUID()}${extension ? `.${extension}` : ''}`;

    await this.s3Client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
      }),
    );

    return {
      url: this.resolvePublicUrl(bucket, key),
      mediaType,
    };
  }

  private async resolveTags(dto: CreatePostDto): Promise<BeliefTag[]> {
    const slugInputs = Array.from(
      new Set(
        (dto.tags ?? [])
          .map((tag) => this.slugify(tag))
          .filter((tag): tag is string => Boolean(tag)),
      ),
    );
    const tagIds = Array.from(new Set(dto.tagIds ?? []));

    const existingByIds =
      tagIds.length > 0
        ? await this.beliefTagRepo.find({ where: { id: In(tagIds.map((id) => Number(id))) } })
        : [];
    const existingBySlugs =
      slugInputs.length > 0
        ? await this.beliefTagRepo.find({ where: { slug: In(slugInputs) } })
        : [];

    const existingBySlugMap = new Map(existingBySlugs.map((tag) => [tag.slug, tag]));
    const missingSlugs = slugInputs.filter((slug) => !existingBySlugMap.has(slug));

    const createdTags: BeliefTag[] = [];
    for (const slug of missingSlugs) {
      const tag = this.beliefTagRepo.create({
        slug,
        name: this.titleizeTag(slug),
      });
      createdTags.push(await this.beliefTagRepo.save(tag));
    }

    return [...existingByIds, ...existingBySlugs, ...createdTags];
  }

  private attachTags(post: Post): Post {
    const tags = post.postTags?.map((postTag) => postTag.tag?.slug).filter(Boolean) ?? [];
    return Object.assign(post, { tags });
  }

  private getMediaTypeFromMime(mimeType: string): MediaType | null {
    if (mimeType.startsWith('image/')) return MediaType.IMAGE;
    if (mimeType.startsWith('video/')) return MediaType.VIDEO;
    return null;
  }

  private resolvePublicUrl(bucket: string, key: string): string {
    const publicBase =
      this.configService.get<string>('S3_PUBLIC_BASE_URL') ||
      this.configService.get<string>('AWS_S3_PUBLIC_BASE_URL');
    if (publicBase) {
      return `${publicBase.replace(/\/$/, '')}/${key}`;
    }

    const endpoint =
      this.configService.get<string>('S3_ENDPOINT') ||
      this.configService.get<string>('AWS_S3_ENDPOINT');
    if (endpoint) {
      return `${endpoint.replace(/\/$/, '')}/${bucket}/${key}`;
    }

    const region =
      this.configService.get<string>('S3_REGION') ||
      this.configService.get<string>('AWS_REGION') ||
      'us-east-1';
    return `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
  }

  private slugify(tag: string): string | null {
    const slug = tag
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    return slug || null;
  }

  private titleizeTag(slug: string): string {
    return slug
      .split('-')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }
}
