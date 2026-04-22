'use client';

import { useEffect, useRef, useCallback } from 'react';
import PostCard from './PostCard';
import { useFeedStore } from '@/lib/stores/feed.store';

function PostSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 animate-pulse">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-gray-200" />
        <div className="flex-1 space-y-3">
          <div className="flex gap-2">
            <div className="h-4 w-24 bg-gray-200 rounded" />
            <div className="h-4 w-16 bg-gray-100 rounded" />
          </div>
          <div className="space-y-2">
            <div className="h-4 w-full bg-gray-100 rounded" />
            <div className="h-4 w-3/4 bg-gray-100 rounded" />
          </div>
          <div className="flex gap-6 pt-2">
            <div className="h-4 w-12 bg-gray-100 rounded" />
            <div className="h-4 w-12 bg-gray-100 rounded" />
            <div className="h-4 w-12 bg-gray-100 rounded" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function FeedList() {
  const { posts, isLoading, hasMore, fetchFeed, fetchMore } = useFeedStore();
  const observerRef = useRef<IntersectionObserver | null>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchFeed();
  }, [fetchFeed]);

  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries;
      if (entry.isIntersecting && hasMore && !isLoading) {
        fetchMore();
      }
    },
    [hasMore, isLoading, fetchMore]
  );

  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver(handleObserver, { threshold: 0.1 });
    if (sentinelRef.current) observerRef.current.observe(sentinelRef.current);

    return () => observerRef.current?.disconnect();
  }, [handleObserver]);

  return (
    <div className="space-y-4">
      {posts.map((item) => (
        <PostCard key={item.post.id} item={item} />
      ))}

      {isLoading && (
        <div className="space-y-4">
          <PostSkeleton />
          <PostSkeleton />
          <PostSkeleton />
        </div>
      )}

      {!isLoading && posts.length === 0 && (
        <div className="text-center py-16">
          <p className="text-gray-500 text-lg">Your feed is empty</p>
          <p className="text-gray-400 text-sm mt-1">Follow some people or adjust your perspective slider</p>
        </div>
      )}

      <div ref={sentinelRef} className="h-4" />
    </div>
  );
}

export default FeedList;
