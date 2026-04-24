'use client';

import { useState, useCallback, useRef, type ChangeEvent } from 'react';
import { Image as ImageIcon, X, Hash } from 'lucide-react';
import Button from '@/components/ui/Button';
import Avatar from '@/components/ui/Avatar';
import Badge from '@/components/ui/Badge';
import { useAuthStore } from '@/lib/stores/auth.store';
import { createPost, uploadMedia } from '@/lib/api/posts';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

const MAX_CHARS = 500;

const SUGGESTED_TAGS = [
  'politics', 'tech', 'science', 'health', 'education',
  'environment', 'economics', 'culture', 'philosophy', 'media',
];

export function CreatePostForm() {
  const [content, setContent] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showTags, setShowTags] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [media, setMedia] = useState<{ url: string; mediaType: 'image' | 'video' } | null>(null);
  const { user } = useAuthStore();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const charsLeft = MAX_CHARS - content.length;
  const isOverLimit = charsLeft < 0;

  const toggleTag = useCallback((tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  }, []);

  const handleSubmit = async () => {
    if ((!content.trim() && !media) || isOverLimit || submitting || uploading) return;
    setSubmitting(true);
    try {
      const post = await createPost({
        content: content.trim(),
        mediaUrls: media ? [media.url] : undefined,
        mediaType: media?.mediaType ?? null,
        tags: selectedTags,
      });
      toast.success('Post published!');
      router.push(`/post/${post.id}`);
    } catch {
      toast.error('Failed to publish post');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePickMedia = () => {
    if (!uploading) {
      fileInputRef.current?.click();
    }
  };

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const uploaded = await uploadMedia(file);
      setMedia(uploaded);
      toast.success(`${uploaded.mediaType === 'video' ? 'Video' : 'Image'} uploaded`);
    } catch {
      toast.error('Failed to upload media');
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
      <div className="flex items-start gap-3">
        <Avatar src={user?.avatarUrl} name={user?.displayName} size="md" />

        <div className="flex-1">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            className="hidden"
            onChange={handleFileChange}
          />
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

          {media && (
            <div className="mb-4 overflow-hidden rounded-2xl border border-gray-100">
              <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50 px-4 py-2 text-xs font-medium text-gray-500">
                <span>{media.mediaType === 'video' ? 'Attached video' : 'Attached image'}</span>
                <button
                  type="button"
                  onClick={() => setMedia(null)}
                  className="rounded-lg p-1 text-gray-400 hover:bg-white hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              {media.mediaType === 'video' ? (
                <video src={media.url} controls className="max-h-96 w-full bg-black" />
              ) : (
                <img src={media.url} alt="Upload preview" className="max-h-96 w-full object-cover" />
              )}
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
              <button
                type="button"
                onClick={handlePickMedia}
                disabled={uploading}
                className="p-2 rounded-lg text-gray-400 hover:text-huum-amber-500 hover:bg-huum-amber-50 transition-colors disabled:opacity-50"
              >
                <ImageIcon className="w-5 h-5" />
              </button>
              <button
                type="button"
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
                disabled={(!content.trim() && !media) || isOverLimit || uploading}
                isLoading={submitting || uploading}
                size="md"
              >
                {uploading ? 'Uploading...' : 'Publish'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CreatePostForm;
