'use client';

import { formatDistanceToNow } from 'date-fns';
import { Badge } from '@/components/ui/Badge';
import type { ModerationAction } from '@/lib/types';

const actionBadgeVariant: Record<string, 'default' | 'warning' | 'danger' | 'primary'> = {
  no_action: 'default',
  warning: 'warning',
  visibility_reduction: 'warning',
  content_removal: 'danger',
  temporary_suspension: 'danger',
  permanent_ban: 'danger',
  appeal_granted: 'primary',
};

const actionLabel: Record<string, string> = {
  no_action: 'No action taken',
  warning: 'Warning issued',
  visibility_reduction: 'Visibility reduced',
  content_removal: 'Content removed',
  temporary_suspension: 'User suspended',
  permanent_ban: 'User banned',
  appeal_granted: 'Appeal granted',
};

interface ModerationLogEntryProps {
  action: ModerationAction;
}

export function ModerationLogEntry({ action }: ModerationLogEntryProps) {
  return (
    <div className="flex items-start gap-4 rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <Badge variant={actionBadgeVariant[action.action] ?? 'default'}>
            {actionLabel[action.action] ?? action.action}
          </Badge>
          <span className="text-xs text-gray-400">
            {formatDistanceToNow(new Date(action.createdAt), { addSuffix: true })}
          </span>
        </div>
        <p className="mt-2 text-sm text-gray-600">{action.reason}</p>
      </div>
    </div>
  );
}
