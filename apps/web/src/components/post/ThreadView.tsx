'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Avatar from '@/components/ui/Avatar';
import { Post } from '@/lib/types';
import { postsApi } from '@/lib/api/posts';
import { formatDistanceToNow } from 'date-fns';

interface ThreadViewProps {
  parents?: Post[];
  postId?: string;
}

export function ThreadView({ parents: parentsProp, postId }: ThreadViewProps) {
  const [parents, setParents] = useState<Post[]>(parentsProp ?? []);

  useEffect(() => {
    if (parentsProp) {
      setParents(parentsProp);
      return;
    }
    if (!postId) return;
    let cancelled = false;
    const walk = async () => {
      const chain: Post[] = [];
      let currentId: string | undefined = postId;
      while (currentId) {
        try {
          const p = await postsApi.getPost(currentId);
          chain.unshift(p);
          currentId = p.parentPostId ?? undefined;
        } catch {
          break;
        }
      }
      if (!cancelled) setParents(chain);
    };
    walk();
    return () => {
      cancelled = true;
    };
  }, [postId, parentsProp]);

  if (parents.length === 0) return null;

  return (
    <div className="mb-4">
      {parents.map((post, index) => (
        <div key={post.id} className="relative">
          {index < parents.length - 1 && (
            <div className="absolute left-[19px] top-12 bottom-0 w-0.5 bg-gray-200" />
          )}
          <Link
            href={`/post/${post.id}`}
            className="flex items-start gap-3 p-4 rounded-xl hover:bg-gray-50 transition-colors"
          >
            <Avatar src={post.author.avatarUrl} name={post.author.displayName} size="sm" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm text-gray-900">{post.author.displayName}</span>
                <span className="text-sm text-gray-500">@{post.author.username}</span>
                <span className="text-gray-300">·</span>
                <time className="text-xs text-gray-400">
                  {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
                </time>
              </div>
              <p className="text-sm text-gray-600 mt-1 line-clamp-2">{post.content}</p>
            </div>
          </Link>
        </div>
      ))}
      <div className="pl-[19px] py-2">
        <div className="w-0.5 h-4 bg-gray-200" />
      </div>
    </div>
  );
}

export default ThreadView;
