'use client';

import { Heart, MessageCircle, Repeat2, Share, Flag, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import Avatar from '@/components/ui/Avatar';
import Badge from '@/components/ui/Badge';
import { Post } from '@/lib/types';
import { useAuthStore } from '@/lib/stores/auth.store';
import Link from 'next/link';

interface PostDetailProps {
  post: Post;
  onLike?: () => void;
  onDelete?: () => void;
  onReport?: () => void;
}

export function PostDetail({ post, onLike, onDelete, onReport }: PostDetailProps) {
  const { user } = useAuthStore();
  const isOwn = user?.id === post.author.id;

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
      <div className="p-6">
        <div className="flex items-center gap-3">
          <Link href={`/profile/${post.author.username}`}>
            <Avatar src={post.author.avatarUrl} name={post.author.displayName} size="lg" />
          </Link>
          <div>
            <Link href={`/profile/${post.author.username}`} className="font-semibold text-gray-900 hover:underline">
              {post.author.displayName}
            </Link>
            <p className="text-sm text-gray-500">@{post.author.username}</p>
          </div>
        </div>

        <div className="mt-4">
          <p className="text-lg text-gray-800 leading-relaxed whitespace-pre-wrap">{post.content}</p>
        </div>

        {(post.mediaUrls?.length ?? 0) > 0 && (
          <div className="mt-4 rounded-xl overflow-hidden border border-gray-100">
            {post.mediaType === 'video' ? (
              <video src={post.mediaUrls![0]} controls className="w-full max-h-[500px] bg-black object-contain" />
            ) : (
              <img src={post.mediaUrls![0]} alt="Post media" className="w-full max-h-[500px] object-cover" />
            )}
          </div>
        )}

        {(post.tags?.length ?? 0) > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {post.tags!.map((tag) => (
              <Badge key={tag} color="amber">#{tag}</Badge>
            ))}
          </div>
        )}

        <div className="mt-4 pt-4 border-t border-gray-100">
          <time className="text-sm text-gray-400">
            {format(new Date(post.createdAt), 'MMM d, yyyy · h:mm a')}
          </time>
        </div>

        <div className="flex items-center gap-6 mt-4 pt-4 border-t border-gray-100">
          <button
            onClick={onLike}
            className={`flex items-center gap-2 text-sm transition-colors
              ${post.isLiked ? 'text-huum-coral-500' : 'text-gray-500 hover:text-huum-coral-500'}`}
          >
            <Heart className={`w-5 h-5 ${post.isLiked ? 'fill-current' : ''}`} />
            <span className="font-medium">{post.likesCount}</span>
          </button>

          <div className="flex items-center gap-2 text-sm text-gray-500">
            <MessageCircle className="w-5 h-5" />
            <span className="font-medium">{post.commentsCount}</span>
          </div>

          <button className="flex items-center gap-2 text-sm text-gray-500 hover:text-emerald-500 transition-colors">
            <Repeat2 className="w-5 h-5" />
            <span className="font-medium">{post.repostsCount}</span>
          </button>

          <button className="flex items-center gap-2 text-sm text-gray-500 hover:text-huum-amber-500 transition-colors">
            <Share className="w-5 h-5" />
          </button>

          <div className="ml-auto flex items-center gap-2">
            {isOwn ? (
              <button
                onClick={onDelete}
                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={onReport}
                className="p-2 text-gray-400 hover:text-huum-coral-500 hover:bg-huum-coral-50 rounded-lg transition-colors"
              >
                <Flag className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default PostDetail;
