// ============================================================
// Shared types for the HUUM frontend
// Aligned with the NestJS backend entities in apps/api/src/modules
// ============================================================

export type UserRole = 'user' | 'moderator' | 'admin';
export type ProfileFont = 'sans' | 'serif' | 'mono' | 'display';

export interface BeliefTag {
  id: number | string;
  name: string;
  slug: string;
  /** Alias for name — older components may use label */
  label?: string;
  category?: string;
  color?: string;
}

export interface UserPreferences {
  perspectiveSlider: number; // 0.0 = bubble, 1.0 = wide open
  /** Alias — frontend-scale 0..100 if some components want it */
  perspectiveLevel?: number;
  showSensitive?: boolean;
  notificationEmails?: boolean;
  notificationsEnabled?: boolean;
  emailNotifications?: boolean;
  theme: 'light' | 'dark' | 'system';
}

export interface User {
  id: string;
  username: string;
  email: string;
  displayName: string | null;
  avatarUrl?: string | null;
  bannerUrl?: string | null;
  bio?: string | null;
  profileFont?: ProfileFont;
  role: UserRole;
  isVerified?: boolean;
  isSuspended?: boolean;
  beliefTags?: BeliefTag[];
  followerCount?: number;
  followingCount?: number;
  /** Alias used by some components */
  followersCount?: number;
  isFollowing?: boolean;
  createdAt: string;
  preferences?: UserPreferences;
}

export type PostVisibility = 'public' | 'reduced' | 'hidden';

export interface Post {
  id: string;
  author: User;
  content: string;
  mediaUrls?: string[];
  mediaType?: 'image' | 'video' | null;
  tags?: string[];
  likeCount: number;
  commentCount: number;
  repostCount: number;
  /** Aliases for older components */
  likesCount?: number;
  commentsCount?: number;
  repostsCount?: number;
  isLiked?: boolean;
  isReposted?: boolean;
  parentPostId?: string | null;
  /** Alias */
  parentId?: string | null;
  repostOfId?: string | null;
  visibility?: PostVisibility;
  createdAt: string;
  updatedAt?: string;
}

export type FeedReason = 'following' | 'diverse_viewpoint' | 'trending' | 'recommended';

export interface FeedItem {
  post: Post;
  reason?: FeedReason;
  score?: number;
}

export interface Comment {
  id: string;
  postId: string;
  author: User;
  content: string;
  parentCommentId?: string | null;
  likeCount: number;
  likesCount?: number; // alias
  isLiked?: boolean;
  depth?: number;
  replies?: Comment[];
  /** Some backends return nested children, mirror replies */
  children?: Comment[];
  createdAt: string;
}

export type ReportCategory =
  | 'hate_speech'
  | 'misinformation'
  | 'harassment'
  | 'spam'
  | 'violence'
  | 'illegal_content'
  | 'other';

export type ReportStatus =
  | 'pending'
  | 'under_review'
  | 'community_vote'
  | 'resolved_no_action'
  | 'resolved_warning'
  | 'resolved_reduced'
  | 'resolved_suspended'
  | 'resolved_banned'
  // Legacy/shorthand values
  | 'reviewing'
  | 'resolved'
  | 'dismissed';

export interface Report {
  id: string;
  reporterId?: string;
  reportedPostId?: string | null;
  reportedUserId?: string | null;
  /** Richer view returned by the queue endpoint */
  reportedPost?: Post | null;
  /** Legacy fields some components still use */
  targetType?: 'post' | 'comment' | 'user';
  targetId?: string;
  category: ReportCategory;
  description?: string | null;
  status: ReportStatus;
  post?: Post;
  comment?: Comment;
  createdAt: string;
  updatedAt?: string;
}

export type ModerationActionType =
  | 'warning'
  | 'visibility_reduction'
  | 'temporary_suspension'
  | 'permanent_ban'
  | 'content_removal'
  | 'no_action'
  | 'appeal_granted'
  // Legacy
  | 'warn'
  | 'remove_content'
  | 'suspend_user'
  | 'dismiss'
  | 'escalate';

export interface ModerationAction {
  id: string;
  moderatorId?: string | null;
  reportId?: string | null;
  targetUserId?: string | null;
  targetPostId?: string | null;
  action: ModerationActionType;
  reason: string;
  isPublic?: boolean;
  createdAt: string;
}

export interface CommunityVote {
  id: string;
  reportId: string;
  voterId: string;
  /** Alias */
  userId?: string;
  vote: 'violates' | 'no_violation' | 'unsure';
  createdAt: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total?: number;
  page?: number;
  limit?: number;
  hasMore?: boolean;
  nextCursor?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  username: string;
  email: string;
  password: string;
  displayName: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}
