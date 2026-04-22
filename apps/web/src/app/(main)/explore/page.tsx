'use client';

import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { PostCard } from '@/components/feed/PostCard';
import { feedApi } from '@/lib/api/feed';
import type { Post } from '@/lib/types';

const trendingTopics = [
  'tech', 'politics', 'philosophy', 'environment', 'science',
  'economics', 'culture', 'education', 'health', 'media',
];

export default function ExplorePage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    feedApi
      .getExplore({ tag: selectedTag ?? undefined })
      .then((res) => setPosts(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [selectedTag]);

  return (
    <div className="max-w-2xl">
      <h1 className="mb-6 text-2xl font-bold">Explore</h1>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search posts, topics, people..."
          className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-10 pr-4 text-sm focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-100"
        />
      </div>

      {/* Topic tags */}
      <div className="mb-6 flex flex-wrap gap-2">
        {trendingTopics.map((tag) => (
          <button key={tag} onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}>
            <Badge variant={selectedTag === tag ? 'primary' : 'default'}>{tag}</Badge>
          </button>
        ))}
      </div>

      {/* Posts */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-40 animate-pulse rounded-xl bg-gray-100" />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
          {posts.length === 0 && (
            <p className="py-12 text-center text-gray-400">No posts found. Be the first!</p>
          )}
        </div>
      )}
    </div>
  );
}
