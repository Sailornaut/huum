'use client';

import { useState } from 'react';
import { Flag } from 'lucide-react';
import { ReportModal } from './ReportModal';

interface ReportButtonProps {
  postId?: string;
  userId?: string;
}

export function ReportButton({ postId, userId }: ReportButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded-lg p-1.5 text-gray-400 transition hover:bg-red-50 hover:text-red-500"
        title="Report"
      >
        <Flag className="h-4 w-4" />
      </button>
      {open && (
        <ReportModal
          postId={postId}
          userId={userId}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
