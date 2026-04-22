'use client';

import Link from 'next/link';
import { Heart, MessageCircle, Repeat2, Share } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import Avatar from '@/components/ui/Avatar';
import Badge from '@/components/ui/Badge';
import { FeedItem, Post } from '@/lib/types';

interface PostCardProps {
  item?: FeedItem;
  post?: Post;
  onLike?: (postId: string) => void;
}

export function PostCard({ item, post: postProp, onLike }: PostCardProps) {
  const post = item?.post ?? postProp;
  const reason = item?.reason;
  if (!post) return null;

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
                <img
                  src={post.mediaUrls![0]}
                  alt="Post media"
                  className="w-full max-h-96 object-cover"
                />
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
            onClick={() => onLike?.(post.id)}
            className={`flex items-center gap-1.5 text-sm transition-colors group
              ${post.isLiked ? 'text-huum-coral-500' : 'text-gray-400 hover:text-huum-coral-500'}`}
          >
            <Heart className={`w-[18px] h-[18px] ${post.isLiked ? 'fill-current' : ''} group-hover:scale-110 transition-transform`} />
            <span>{post.likesCount}</span>
          </button>

          <Link
            href={`/post/${post.id}`}
            className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-huum-amber-500 transition-colors"
          >
            <MessageCircle className="w-[18px] h-[18px]" />
            <span>{post.commentsCount}</span>
          </Link>

          <button className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-emerald-500 transition-colors">
            <Repeat2 className={`w-[18px] h-[18px] ${post.isReposted ? 'text-emerald-500' : ''}`} />
            <span>{post.repostsCount}</span>
          </button>

          <button className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-huum-amber-500 transition-colors">
            <Share className="w-[18px] h-[18px]" />
          </button>
        </div>
      </div>
    </article>
  );
}

export default PostCard;
