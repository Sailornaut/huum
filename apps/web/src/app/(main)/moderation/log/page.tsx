'use client';

import { useEffect, useState } from 'react';
import { ScrollText } from 'lucide-react';
import { ModerationLogEntry } from '@/components/moderation/ModerationLogEntry';
import { Button } from '@/components/ui/Button';
import { moderationApi } from '@/lib/api/moderation';
import type { ModerationAction } from '@/lib/types';

export default function ModerationLogPage() {
  const [actions, setActions] = useState<ModerationAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [cursor, setCursor] = useState<string | undefined>();

  const loadMore = async () => {
    try {
      const res = await moderationApi.getPublicLog({ cursor, limit: 20 });
      setActions((prev) => [...prev, ...res.data]);
      setCursor(res.nextCursor);
    } catch {
      // handle error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMore();
  }, []);

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6 flex items-center gap-3">
        <ScrollText className="h-7 w-7 text-amber-500" />
        <div>
          <h1 className="text-2xl font-bold">Moderation Log</h1>
          <p className="text-sm text-gray-500">
            Transparency matters. All moderation actions are publicly logged.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl bg-gray-100" />
          ))}
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {actions.map((action) => (
              <ModerationLogEntry key={action.id} action={action} />
            ))}
            {actions.length === 0 && (
              <p className="py-12 text-center text-gray-400">No moderation actions yet.</p>
            )}
          </div>
          {cursor && (
            <div className="mt-6 text-center">
              <Button variant="ghost" onClick={loadMore}>
                Load more
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
