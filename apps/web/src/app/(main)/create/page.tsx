'use client';

import { CreatePostForm } from '@/components/post/CreatePostForm';

export default function CreatePage() {
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 text-2xl font-bold">Create Post</h1>
      <CreatePostForm />
    </div>
  );
}
