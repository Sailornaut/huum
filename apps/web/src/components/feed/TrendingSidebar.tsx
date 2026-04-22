'use client';

import { useState, useEffect } from 'react';
import { TrendingUp } from 'lucide-react';
import Card from '@/components/ui/Card';
import { getTrending } from '@/lib/api/feed';

interface TrendingTopic {
  tag: string;
  count: number;
}

export function TrendingSidebar() {
  const [topics, setTopics] = useState<TrendingTopic[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getTrending()
      .then((data) => setTopics(data.topics.slice(0, 5)))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <Card>
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="w-5 h-5 text-huum-coral-500" />
        <h3 className="font-semibold text-gray-900">Trending Discussions</h3>
      </div>

      {loading ? (
        <div className="space-y-3 animate-pulse">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex justify-between">
              <div className="h-4 w-28 bg-gray-100 rounded" />
              <div className="h-4 w-10 bg-gray-100 rounded" />
            </div>
          ))}
        </div>
      ) : topics.length > 0 ? (
        <ul className="space-y-3">
          {topics.map((topic) => (
            <li key={topic.tag}>
              <button className="w-full flex items-center justify-between group">
                <span className="text-sm font-medium text-gray-700 group-hover:text-huum-amber-600 transition-colors">
                  #{topic.tag}
                </span>
                <span className="text-xs text-gray-400">{topic.count} posts</span>
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-gray-400">No trending topics yet</p>
      )}
    </Card>
  );
}

export default TrendingSidebar;
