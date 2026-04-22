'use client';

import { useEffect } from 'react';
import { FeedList } from '@/components/feed/FeedList';
import { PerspectiveSlider } from '@/components/feed/PerspectiveSlider';
import { TrendingSidebar } from '@/components/feed/TrendingSidebar';
import { useFeedStore } from '@/lib/stores/feed.store';

export default function FeedPage() {
  const { fetchFeed, perspectiveLevel } = useFeedStore();

  useEffect(() => {
    fetchFeed();
  }, [fetchFeed, perspectiveLevel]);

  return (
    <div className="flex gap-8">
      <div className="min-w-0 flex-1">
        <h1 className="mb-6 text-2xl font-bold">Your Feed</h1>
        <PerspectiveSlider />
        <div className="mt-6">
          <FeedList />
        </div>
      </div>

      {/* Trending sidebar — desktop only */}
      <aside className="hidden w-80 shrink-0 xl:block">
        <div className="sticky top-24">
          <TrendingSidebar />
        </div>
      </aside>
    </div>
  );
}
