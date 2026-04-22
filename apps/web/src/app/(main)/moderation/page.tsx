'use client';

import { useEffect, useState } from 'react';
import { Shield } from 'lucide-react';
import { ModerationQueue } from '@/components/moderation/ModerationQueue';
import { moderationApi } from '@/lib/api/moderation';
import { useAuthStore } from '@/lib/stores/auth.store';
import type { Report } from '@/lib/types';

export default function ModerationDashboard() {
  const user = useAuthStore((s) => s.user);
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    moderationApi
      .getQueue()
      .then((res) => setReports(res))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (user?.role !== 'admin' && user?.role !== 'moderator') {
    return (
      <div className="py-20 text-center text-gray-400">
        You don&apos;t have permission to access the moderation dashboard.
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6 flex items-center gap-3">
        <Shield className="h-7 w-7 text-amber-500" />
        <h1 className="text-2xl font-bold">Moderation Queue</h1>
        <span className="rounded-full bg-red-100 px-3 py-1 text-sm font-medium text-red-700">
          {reports.filter((r) => r.status === 'pending').length} pending
        </span>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-36 animate-pulse rounded-xl bg-gray-100" />
          ))}
        </div>
      ) : (
        <ModerationQueue reports={reports} onUpdate={() => {
          moderationApi.getQueue().then(setReports);
        }} />
      )}
    </div>
  );
}
