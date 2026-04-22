'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { usersApi } from '@/lib/api/users';

interface FollowButtonProps {
  userId: string;
  initialFollowing?: boolean;
}

export function FollowButton({ userId, initialFollowing = false }: FollowButtonProps) {
  const [following, setFollowing] = useState(initialFollowing);
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    try {
      if (following) {
        await usersApi.unfollow(userId);
      } else {
        await usersApi.follow(userId);
      }
      setFollowing(!following);
    } catch {
      // handle error
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant={following ? 'secondary' : 'primary'}
      size="sm"
      loading={loading}
      onClick={handleClick}
    >
      {following ? 'Following' : 'Follow'}
    </Button>
  );
}
