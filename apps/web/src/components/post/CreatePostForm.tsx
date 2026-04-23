'use client';

import { useState, useCallback } from 'react';
import { Image as ImageIcon, X, Hash } from 'lucide-react';
import Button from '@/components/ui/Button';
import Avatar from '@/components/ui/Avatar';
import Badge from '@/components/ui/Badge';
import { useAuthStore } from '@/lib/stores/auth.store';
import { createPost } from '@/lib/api/posts';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

const MAX_CHARS = 500;

const SUGGESTED_TAGS = [
  'politics', 'technology', 'science', 'health', 'education',
  'climate', 'economy', 'culture', 'philosophy', 'media',
];

export function CreatePostForm() {
  const [content, setContent] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showTags, setShowTags] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { user } = useAuthStore();
  const router = useRouter();

  const charsLeft = MAX_CHARS - content.length;
  const isOverLimit = charsLeft < 0;

  const toggleTag = useCallback((tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  }, []);

  const handleSubmit = async () => {
    if (!content.trim() || isOverLimit || submitting) return;
    setSubmitting(true);
    try {
      const post = await createPost({
        content: content.trim(),
      });
      toast.success('Post published!');
      router.push(`/post/${post.id}`);
    } catch {
      toast.error('Failed to publish post');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
      <div className="flex items-start gap-3">
        <Avatar src={user?.avatarUrl} name={user?.displayName} size="md" />

        <div className="flex-1">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What's on your mind?"
            rows={6}
            autoFocus
            className="w-full px-0 py-2 text-lg text-gray-800 placeholder-gray-400 bg-transparent
              border-0 resize-none focus:outline-none focus:ring-0"
          />

          {selectedTags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {selectedTags.map((tag) => (
                <button key={tag} onClick={() => toggleTag(tag)} className="group">
                  <Badge color="amber">
                    #{tag}
                    <X className="w-3 h-3 ml-1 inline group-hover:text-huum-amber-900" />
                  </Badge>
                </button>
              ))}
            </div>
          )}

          {showTags && (
            <div className="mb-4 p-3 bg-gray-50 rounded-xl">
              <p className="text-xs font-medium text-gray-500 mb-2">Suggested tags</p>
              <div className="flex flex-wrap gap-1.5">
                {SUGGESTED_TAGS.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors
                      ${
                        selectedTags.includes(tag)
                          ? 'bg-huum-amber-100 text-huum-amber-700'
                          : 'bg-white text-gray-600 border border-gray-200 hover:border-huum-amber-300'
                      }`}
                  >
                    #{tag}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between pt-3 border-t border-gray-100">
            <div className="flex items-center gap-2">
              <button className="p-2 rounded-lg text-gray-400 hover:text-huum-amber-500 hover:bg-huum-amber-50 transition-colors">
                <ImageIcon className="w-5 h-5" />
              </button>
              <button
                onClick={() => setShowTags(!showTags)}
                className={`p-2 rounded-lg transition-colors
                  ${showTags ? 'text-huum-amber-500 bg-huum-amber-50' : 'text-gray-400 hover:text-huum-amber-500 hover:bg-huum-amber-50'}`}
              >
                <Hash className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center gap-3">
              <span
                className={`text-sm font-medium ${
                  isOverLimit ? 'text-red-500' : charsLeft < 50 ? 'text-huum-amber-500' : 'text-gray-400'
                }`}
              >
                {charsLeft}
              </span>
              <Button
                onClick={handleSubmit}
                disabled={!content.trim() || isOverLimit}
                isLoading={submitting}
                size="md"
              >
                Publish
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CreatePostForm;
