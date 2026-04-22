'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { moderationApi } from '@/lib/api/moderation';

const CATEGORIES = [
  { value: 'hate_speech', label: 'Hate speech' },
  { value: 'misinformation', label: 'Misinformation' },
  { value: 'harassment', label: 'Harassment' },
  { value: 'spam', label: 'Spam' },
  { value: 'violence', label: 'Violence / threats' },
  { value: 'illegal_content', label: 'Illegal content' },
  { value: 'other', label: 'Other' },
];

interface ReportModalProps {
  postId?: string;
  userId?: string;
  onClose: () => void;
}

export function ReportModal({ postId, userId, onClose }: ReportModalProps) {
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!category) {
      toast.error('Please select a category');
      return;
    }
    setLoading(true);
    try {
      await moderationApi.createReport({
        reportedPostId: postId,
        reportedUserId: userId,
        category,
        description: description || undefined,
      });
      toast.success('Report submitted. Thank you.');
      onClose();
    } catch {
      toast.error('Failed to submit report');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal title="Report content" onClose={onClose}>
      <div className="space-y-4">
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            What&apos;s the issue?
          </label>
          <div className="space-y-2">
            {CATEGORIES.map((c) => (
              <label
                key={c.value}
                className={`flex cursor-pointer items-center rounded-xl border px-4 py-3 text-sm transition ${
                  category === c.value
                    ? 'border-amber-400 bg-amber-50'
                    : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                <input
                  type="radio"
                  name="category"
                  value={c.value}
                  checked={category === c.value}
                  onChange={() => setCategory(c.value)}
                  className="sr-only"
                />
                {c.label}
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Additional details (optional)
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-100"
            placeholder="Help us understand the issue..."
            maxLength={500}
          />
        </div>

        <div className="flex gap-3">
          <Button variant="ghost" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button onClick={handleSubmit} loading={loading} className="flex-1">
            Submit report
          </Button>
        </div>
      </div>
    </Modal>
  );
}
