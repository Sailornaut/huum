import { Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { PostsService } from '../posts/posts.service';
import { Post } from '../posts/entities/post.entity';

interface ScoredPost {
  post: Post;
  score: number;
  source: 'followed' | 'diverse' | 'trending';
}

@Injectable()
export class FeedService {
  constructor(
    private readonly usersService: UsersService,
    private readonly postsService: PostsService,
  ) {}

  /**
   * Main personalized feed with perspective slider algorithm.
   *
   * perspectiveLevel (0.0 - 1.0):
   *   0.0 = echo chamber (mostly followed users)
   *   1.0 = max diversity (more diverse viewpoints + trending)
   *
   * Ratios:
   *   followed_ratio = 1.0 - (perspectiveLevel * 0.7)
   *   diverse_ratio  = perspectiveLevel * 0.5
   *   trending_ratio = 1.0 - followed_ratio - diverse_ratio (the rest)
   *
   * Scoring:
   *   recency (40%) + engagement (60%)
   *   engagement = likes*1 + comments*2 + reposts*1.5
   */
  async getFeed(userId: string, page = 1, limit = 20): Promise<Post[]> {
    const prefs = await this.usersService.getPreferences(userId);
    const perspectiveLevel = prefs.perspectiveSlider;

    // Calculate ratios
    const followedRatio = 1.0 - perspectiveLevel * 0.7;
    const diverseRatio = perspectiveLevel * 0.5;
    const trendingRatio = Math.max(0, 1.0 - followedRatio - diverseRatio);

    // Calculate how many posts of each type we need
    const totalFetch = limit * 3; // fetch more to have room for scoring
    const followedCount = Math.ceil(totalFetch * followedRatio);
    const diverseCount = Math.ceil(totalFetch * diverseRatio);
    const trendingCount = Math.ceil(totalFetch * trendingRatio);

    // Get followed user IDs
    const followedIds = await this.usersService.getFollowingIds(userId);

    // Fetch all three pools in parallel
    const [followedPosts, diversePosts, trendingPosts] = await Promise.all([
      this.postsService.getFollowedPosts(followedIds, followedCount),
      this.postsService.getPostsNotByUsers([userId, ...followedIds], diverseCount),
      this.postsService.getTrendingPosts(trendingCount),
    ]);

    // Score all posts
    const now = Date.now();
    const scored: ScoredPost[] = [
      ...followedPosts.map((p) => ({
        post: p,
        score: this.scorePost(p, now),
        source: 'followed' as const,
      })),
      ...diversePosts.map((p) => ({
        post: p,
        score: this.scorePost(p, now),
        source: 'diverse' as const,
      })),
      ...trendingPosts.map((p) => ({
        post: p,
        score: this.scorePost(p, now),
        source: 'trending' as const,
      })),
    ];

    // Deduplicate by post ID
    const seen = new Set<string>();
    const unique = scored.filter((s) => {
      if (seen.has(s.post.id)) return false;
      seen.add(s.post.id);
      return true;
    });

    // Sort each pool by score
    const sortedFollowed = unique
      .filter((s) => s.source === 'followed')
      .sort((a, b) => b.score - a.score);
    const sortedDiverse = unique
      .filter((s) => s.source === 'diverse')
      .sort((a, b) => b.score - a.score);
    const sortedTrending = unique
      .filter((s) => s.source === 'trending')
      .sort((a, b) => b.score - a.score);

    // Interleave: every 5th post = diverse, every 10th = trending, rest = followed
    const result: Post[] = [];
    let fi = 0,
      di = 0,
      ti = 0;

    for (let i = 1; result.length < limit; i++) {
      if (i % 10 === 0 && ti < sortedTrending.length) {
        result.push(sortedTrending[ti].post);
        ti++;
      } else if (i % 5 === 0 && di < sortedDiverse.length) {
        result.push(sortedDiverse[di].post);
        di++;
      } else if (fi < sortedFollowed.length) {
        result.push(sortedFollowed[fi].post);
        fi++;
      } else if (di < sortedDiverse.length) {
        result.push(sortedDiverse[di].post);
        di++;
      } else if (ti < sortedTrending.length) {
        result.push(sortedTrending[ti].post);
        ti++;
      } else {
        break; // no more posts available
      }
    }

    // Apply pagination offset
    const offset = (page - 1) * limit;
    return result.slice(offset, offset + limit);
  }

  /**
   * Score a post: recency (40%) + engagement (60%)
   * engagement = likes*1 + comments*2 + reposts*1.5
   */
  private scorePost(post: Post, now: number): number {
    // Recency score: decays over 24 hours, max 1.0
    const ageMs = now - new Date(post.createdAt).getTime();
    const ageHours = ageMs / (1000 * 60 * 60);
    const recencyScore = Math.max(0, 1.0 - ageHours / 24);

    // Engagement score: normalized (cap at reasonable max)
    const rawEngagement =
      post.likeCount * 1 + post.commentCount * 2 + post.repostCount * 1.5;
    const engagementScore = Math.min(1.0, rawEngagement / 100);

    return recencyScore * 0.4 + engagementScore * 0.6;
  }

  async getTrending(page = 1, limit = 20): Promise<Post[]> {
    const posts = await this.postsService.getTrendingPosts(limit * page);
    const offset = (page - 1) * limit;
    return posts.slice(offset, offset + limit);
  }

  async getExplore(page = 1, limit = 20): Promise<Post[]> {
    return this.postsService.getPostsNotByUsers([], limit);
  }
}
