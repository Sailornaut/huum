'use client';

import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { moderationApi } from '@/lib/api/moderation';
import type { Report } from '@/lib/types';
import toast from 'react-hot-toast';

interface ModerationQueueProps {
  reports: Report[];
  onUpdate: () => void;
}

const categoryColors: Record<string, 'danger' | 'warning' | 'primary' | 'default'> = {
  hate_speech: 'danger',
  violence: 'danger',
  illegal_content: 'danger',
  harassment: 'warning',
  misinformation: 'warning',
  spam: 'default',
  other: 'default',
};

export function ModerationQueue({ reports, onUpdate }: ModerationQueueProps) {
  const [actioningId, setActioningId] = useState<string | null>(null);

  const takeAction = async (reportId: string, action: string) => {
    setActioningId(reportId);
    try {
      await moderationApi.takeAction({
        reportId,
        action,
        reason: `Moderator action: ${action}`,
      });
      toast.success('Action taken');
      onUpdate();
    } catch {
      toast.error('Failed to take action');
    } finally {
      setActioningId(null);
    }
  };

  if (reports.length === 0) {
    return (
      <div className="py-12 text-center text-gray-400">
        <CheckCircle className="mx-auto mb-3 h-12 w-12" />
        <p>No pending reports. All clear!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {reports.map((report) => (
        <Card key={report.id} className="p-5">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              <Badge variant={categoryColors[report.category] ?? 'default'}>
                {report.category.replace('_', ' ')}
              </Badge>
              <span className="text-xs text-gray-400">
                {formatDistanceToNow(new Date(report.createdAt), { addSuffix: true })}
              </span>
            </div>
            <Badge variant={report.status === 'pending' ? 'warning' : 'default'}>
              {report.status}
            </Badge>
          </div>

          {report.description && (
            <p className="mt-3 text-sm text-gray-600">{report.description}</p>
          )}

          {/* Reported content preview */}
          {report.reportedPost && (
            <div className="mt-3 rounded-lg border border-gray-100 bg-gray-50 p-3 text-sm">
              <p className="font-medium text-gray-700">
                @{report.reportedPost.author?.username}
              </p>
              <p className="mt-1 text-gray-600">{report.reportedPost.content}</p>
            </div>
          )}

          {/* Action buttons */}
          {report.status === 'pending' && (
            <div className="mt-4 flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => takeAction(report.id, 'no_action')}
                loading={actioningId === report.id}
              >
                <XCircle className="mr-1 h-4 w-4" /> No action
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => takeAction(report.id, 'warning')}
                loading={actioningId === report.id}
              >
                Warning
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => takeAction(report.id, 'visibility_reduction')}
                loading={actioningId === report.id}
              >
                Reduce visibility
              </Button>
              <Button
                size="sm"
                variant="primary"
                onClick={() => takeAction(report.id, 'content_removal')}
                loading={actioningId === report.id}
              >
                Remove content
              </Button>
              <Button
                size="sm"
                variant="primary"
                onClick={() => takeAction(report.id, 'temporary_suspension')}
                loading={actioningId === report.id}
                className="bg-red-500 hover:bg-red-600"
              >
                Suspend user
              </Button>
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}
