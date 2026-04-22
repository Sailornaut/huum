'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { moderationApi } from '@/lib/api/moderation';
import type { Report } from '@/lib/types';

interface CommunityVoteCardProps {
  report: Report;
  onVoted: () => void;
}

export function CommunityVoteCard({ report, onVoted }: CommunityVoteCardProps) {
  const [loading, setLoading] = useState(false);

  const castVote = async (vote: 'violates' | 'no_violation' | 'unsure') => {
    setLoading(true);
    try {
      await moderationApi.castVote(report.id, { vote });
      toast.success('Vote recorded. Thank you for helping keep HUUM safe.');
      onVoted();
    } catch {
      toast.error('Failed to cast vote');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-6">
      <div className="mb-3 flex items-center gap-2">
        <Badge variant="warning">Community Review</Badge>
        <Badge>{report.category.replace('_', ' ')}</Badge>
      </div>

      <p className="mb-2 text-sm text-gray-500">
        This content has been reported. Does it violate HUUM&apos;s community guidelines?
      </p>

      {/* Reported content */}
      {report.reportedPost && (
        <div className="my-4 rounded-xl border border-gray-200 bg-gray-50 p-4">
          <p className="text-sm text-gray-700">{report.reportedPost.content}</p>
        </div>
      )}

      <div className="flex gap-3">
        <Button
          variant="primary"
          className="flex-1 bg-red-500 hover:bg-red-600"
          loading={loading}
          onClick={() => castVote('violates')}
        >
          Violates guidelines
        </Button>
        <Button
          variant="secondary"
          className="flex-1"
          loading={loading}
          onClick={() => castVote('no_violation')}
        >
          No violation
        </Button>
        <Button
          variant="ghost"
          className="flex-1"
          loading={loading}
          onClick={() => castVote('unsure')}
        >
          Unsure
        </Button>
      </div>
    </Card>
  );
}
