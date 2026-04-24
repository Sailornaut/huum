'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Heart, MessageCircle, Repeat2, Share } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import Avatar from '@/components/ui/Avatar';
import Badge from '@/components/ui/Badge';
import { postsApi } from '@/lib/api/posts';
import { FeedItem, Post } from '@/lib/types';
import toast from 'react-hot-toast';

interface PostCardProps {
  item?: FeedItem;
  post?: Post;
  onLike?: (postId: string) => void;
}

export function PostCard({ item, post: postProp, onLike }: PostCardProps) {
  const initialPost = item?.post ?? postProp;
  const reason = item?.reason;
  const [post, setPost] = useState<Post | null>(initialPost ?? null);
  const [busyAction, setBusyAction] = useState<'like' | 'repost' | null>(null);
  if (!post) return null;

  const likeCount = post.likesCount ?? post.likeCount ?? 0;
  const commentCount = post.commentsCount ?? post.commentCount ?? 0;
  const repostCount = post.repostsCount ?? post.repostCount ?? 0;

  const handleLike = async () => {
    if (busyAction) return;

    if (onLike) {
      onLike(post.id);
      return;
    }

    setBusyAction('like');
    const isLiked = Boolean(post.isLiked);
    setPost({
      ...post,
      isLiked: !isLiked,
      likesCount: likeCount + (isLiked ? -1 : 1),
      likeCount: likeCount + (isLiked ? -1 : 1),
    });

    try {
      if (isLiked) {
        await postsApi.unlikePost(post.id);
      } else {
        await postsApi.likePost(post.id);
      }
    } catch {
      setPost(post);
      toast.error('Failed to update like');
    } finally {
      setBusyAction(null);
    }
  };

  const handleRepost = async () => {
    if (busyAction) return;

    setBusyAction('repost');
    try {
      await postsApi.repost(post.id);
      setPost({
        ...post,
        isReposted: true,
        repostsCount: repostCount + (post.isReposted ? 0 : 1),
        repostCount: repostCount + (post.isReposted ? 0 : 1),
      });
      toast.success('Reposted');
    } catch {
      toast.error('Failed to repost');
    } finally {
      setBusyAction(null);
    }
  };

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/post/${post.id}`;
    try {
      if (navigator.share) {
        await navigator.share({
          title: `${post.author.displayName || post.author.username} on HUUM`,
          text: post.content,
          url: shareUrl,
        });
      } else {
        await navigator.clipboard.writeText(shareUrl);
        toast.success('Post link copied');
      }
    } catch {
      toast.error('Unable to share post');
    }
  };

  return (
    <article className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-200">
      {reason && reason !== 'following' && (
        <div className="px-5 pt-3 pb-0">
          <Badge color={reason === 'diverse_viewpoint' ? 'blue' : reason === 'trending' ? 'coral' : 'amber'}>
            {reason === 'diverse_viewpoint'
              ? 'Diverse Viewpoint'
              : reason === 'trending'
              ? 'Trending'
              : 'Recommended'}
          </Badge>
        </div>
      )}

      <div className="p-5">
        <div className="flex items-start gap-3">
          <Link href={`/profile/${post.author.username}`}>
            <Avatar src={post.author.avatarUrl} name={post.author.displayName} size="md" />
          </Link>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Link
                href={`/profile/${post.author.username}`}
                className="font-semibold text-gray-900 hover:underline text-sm"
              >
                {post.author.displayName}
              </Link>
              <Link
                href={`/profile/${post.author.username}`}
                className="text-gray-500 text-sm"
              >
                @{post.author.username}
              </Link>
              <span className="text-gray-300 text-sm">·</span>
              <time className="text-gray-400 text-sm">
                {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
              </time>
            </div>

            <Link href={`/post/${post.id}`} className="block mt-2">
              <p className="text-gray-800 text-[15px] leading-relaxed whitespace-pre-wrap">
                {post.content}
              </p>
            </Link>

            {(post.mediaUrls?.length ?? 0) > 0 && (
              <div className="mt-3 rounded-xl overflow-hidden border border-gray-100">
                {post.mediaType === 'video' ? (
                  <video
                    src={post.mediaUrls![0]}
                    controls
                    className="w-full max-h-96 bg-black object-contain"
                  />
                ) : (
                  <img
                    src={post.mediaUrls![0]}
                    alt="Post media"
                    className="w-full max-h-96 object-cover"
                  />
                )}
              </div>
            )}

            {(post.tags?.length ?? 0) > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {post.tags!.map((tag) => (
                  <span key={tag} className="text-huum-amber-600 text-sm hover:underline cursor-pointer">
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-50 max-w-md">
          <button
            onClick={handleLike}
            disabled={busyAction === 'like'}
            className={`flex items-center gap-1.5 text-sm transition-colors group
              ${post.isLiked ? 'text-huum-coral-500' : 'text-gray-400 hover:text-huum-coral-500'} disabled:opacity-60`}
          >
            <Heart className={`w-[18px] h-[18px] ${post.isLiked ? 'fill-current' : ''} group-hover:scale-110 transition-transform`} />
            <span>{likeCount}</span>
          </button>

          <Link
            href={`/post/${post.id}`}
            className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-huum-amber-500 transition-colors"
          >
            <MessageCircle className="w-[18px] h-[18px]" />
            <span>{commentCount}</span>
          </Link>

          <button
            onClick={handleRepost}
            disabled={busyAction === 'repost' || post.isReposted}
            className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-emerald-500 transition-colors disabled:opacity-60"
          >
            <Repeat2 className={`w-[18px] h-[18px] ${post.isReposted ? 'text-emerald-500' : ''}`} />
            <span>{repostCount}</span>
          </button>

          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-huum-amber-500 transition-colors"
          >
            <Share className="w-[18px] h-[18px]" />
          </button>
        </div>
      </div>
    </article>
  );
}

export default PostCard;
