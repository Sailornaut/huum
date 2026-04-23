'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { ProfileHeader } from '@/components/profile/ProfileHeader';
import { PostCard } from '@/components/feed/PostCard';
import { usersApi } from '@/lib/api/users';
import { postsApi } from '@/lib/api/posts';
import type { User, Post } from '@/lib/types';

type Tab = 'posts' | 'replies' | 'likes';

export default function ProfilePage() {
  const { username } = useParams<{ username: string }>();
  const [user, setUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [tab, setTab] = useState<Tab>('posts');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    let isCancelled = false;

    usersApi
      .getProfile(username)
      .then(async (u) => {
        if (isCancelled) return;
        setUser(u);

        try {
          const p = await usersApi.getUserPosts(username);
          if (!isCancelled) {
            setPosts(p);
          }
        } catch {
          if (!isCancelled) {
            setPosts([]);
          }
        }
      })
      .catch(() => {
        if (!isCancelled) {
          setUser(null);
          setPosts([]);
        }
      })
      .finally(() => {
        if (!isCancelled) {
          setLoading(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [username]);

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        <div className="h-52 animate-pulse rounded-xl bg-gray-100" />
        <div className="h-32 animate-pulse rounded-xl bg-gray-100" />
      </div>
    );
  }

  if (!user) {
    return <div className="py-20 text-center text-gray-400">User not found.</div>;
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: 'posts', label: 'Posts' },
    { key: 'replies', label: 'Replies' },
    { key: 'likes', label: 'Likes' },
  ];

  return (
    <div className="mx-auto max-w-2xl">
      <ProfileHeader user={user} />

      {/* Tabs */}
      <div className="mt-6 flex border-b border-gray-200">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 py-3 text-center text-sm font-medium transition ${
              tab === t.key
                ? 'border-b-2 border-amber-500 text-amber-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Post list */}
      <div className="mt-4 space-y-4">
        {posts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
        {posts.length === 0 && (
          <p className="py-12 text-center text-gray-400">Nothing here yet.</p>
        )}
      </div>
    </div>
  );
}
