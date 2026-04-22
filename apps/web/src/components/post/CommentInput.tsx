'use client';

import { useState } from 'react';
import { Send } from 'lucide-react';
import Avatar from '@/components/ui/Avatar';
import { useAuthStore } from '@/lib/stores/auth.store';
import { commentsApi } from '@/lib/api/comments';

interface CommentInputProps {
  postId?: string;
  onSubmit?: ((content: string) => Promise<void> | void) | (() => Promise<void> | void);
  placeholder?: string;
  autoFocus?: boolean;
}

export function CommentInput({ postId, onSubmit, placeholder = 'Add a comment...', autoFocus }: CommentInputProps) {
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { user } = useAuthStore();

  const handleSubmit = async () => {
    if (!content.trim() || submitting) return;
    setSubmitting(true);
    try {
      const trimmed = content.trim();
      if (postId) {
        await commentsApi.createComment({ postId, content: trimmed });
        if (onSubmit) await (onSubmit as (c: string) => Promise<void> | void)(trimmed);
      } else if (onSubmit) {
        await (onSubmit as (c: string) => Promise<void> | void)(trimmed);
      }
      setContent('');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex items-start gap-3">
      <Avatar src={user?.avatarUrl} name={user?.displayName} size="sm" />
      <div className="flex-1 relative">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={placeholder}
          autoFocus={autoFocus}
          rows={2}
          className="w-full px-4 py-3 pr-12 rounded-xl border border-gray-200 bg-gray-50
            text-sm text-gray-800 placeholder-gray-400 resize-none
            focus:outline-none focus:ring-2 focus:ring-huum-amber-400/50 focus:border-huum-amber-400 focus:bg-white
            transition-colors"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSubmit();
          }}
        />
        <button
          onClick={handleSubmit}
          disabled={!content.trim() || submitting}
          className="absolute right-3 bottom-3 p-1.5 rounded-lg text-huum-amber-500
            hover:bg-huum-amber-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export default CommentInput;
