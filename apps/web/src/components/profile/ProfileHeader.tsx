'use client';

import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { FollowButton } from '@/components/profile/FollowButton';
import { useAuthStore } from '@/lib/stores/auth.store';
import type { User } from '@/lib/types';

interface ProfileHeaderProps {
  user: User;
}

export function ProfileHeader({ user }: ProfileHeaderProps) {
  const currentUser = useAuthStore((s) => s.user);
  const isOwnProfile = currentUser?.id === user.id;
  const headingClass =
    user.profileFont === 'serif'
      ? 'font-serif'
      : user.profileFont === 'mono'
      ? 'font-mono'
      : user.profileFont === 'display'
      ? 'tracking-tight'
      : '';

  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm">
      {/* Gradient banner */}
      <div
        className="-mx-6 -mt-6 mb-4 h-32 rounded-t-2xl bg-gradient-to-r from-amber-400 to-orange-400 bg-cover bg-center"
        style={user.bannerUrl ? { backgroundImage: `url(${user.bannerUrl})` } : undefined}
      />

      <div className="-mt-16 flex items-end gap-4">
        <Avatar
          src={user.avatarUrl}
          alt={user.displayName ?? user.username}
          size="xl"
          className="ring-4 ring-white"
        />
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <div>
              <h1 className={`text-xl font-bold ${headingClass}`}>{user.displayName ?? user.username}</h1>
              <p className="text-sm text-gray-500">@{user.username}</p>
            </div>
            {!isOwnProfile && <FollowButton userId={user.id} initialFollowing={user.isFollowing} />}
          </div>
        </div>
      </div>

      {/* Bio */}
      {user.bio && <p className="mt-4 text-gray-700">{user.bio}</p>}

      {/* Belief tags */}
      {user.beliefTags && user.beliefTags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {user.beliefTags.map((tag) => (
            <Badge key={tag.slug} variant="primary">
              {tag.name}
            </Badge>
          ))}
        </div>
      )}

      {/* Stats */}
      <div className="mt-4 flex gap-6 text-sm">
        <span>
          <strong>{user.followerCount ?? 0}</strong>{' '}
          <span className="text-gray-500">followers</span>
        </span>
        <span>
          <strong>{user.followingCount ?? 0}</strong>{' '}
          <span className="text-gray-500">following</span>
        </span>
      </div>
    </div>
  );
}
