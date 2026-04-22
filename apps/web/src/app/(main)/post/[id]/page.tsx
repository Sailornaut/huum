'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { PostDetail } from '@/components/post/PostDetail';
import { ThreadView } from '@/components/post/ThreadView';
import { CommentTree } from '@/components/post/CommentTree';
import { CommentInput } from '@/components/post/CommentInput';
import { postsApi } from '@/lib/api/posts';
import { commentsApi } from '@/lib/api/comments';
import type { Post, Comment } from '@/lib/types';

export default function PostPage() {
  const { id } = useParams<{ id: string }>();
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const [postRes, commentsRes] = await Promise.all([
        postsApi.getPost(id),
        commentsApi.getComments(id),
      ]);
      setPost(postRes);
      setComments(commentsRes);
    } catch {
      // handle error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        <div className="h-48 animate-pulse rounded-xl bg-gray-100" />
        <div className="h-32 animate-pulse rounded-xl bg-gray-100" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="py-20 text-center text-gray-400">Post not found.</div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      {/* Parent thread chain */}
      {post.parentPostId && <ThreadView postId={post.parentPostId} />}

      {/* Main post */}
      <PostDetail post={post} />

      {/* Comment input */}
      <div className="mt-6">
        <CommentInput postId={post.id} onSubmit={loadData} />
      </div>

      {/* Threaded comments */}
      <div className="mt-6">
        <h2 className="mb-4 text-lg font-semibold">
          {comments.length} {comments.length === 1 ? 'Comment' : 'Comments'}
        </h2>
        <CommentTree comments={comments} />
      </div>
    </div>
  );
}
