import apiClient from './client';
import { Post, Comment } from '../types';

// ---------------------------------------------
// Namespace API used by pages (postsApi.*)
// ---------------------------------------------
export const postsApi = {
  async createPost(payload: {
    content: string;
    mediaUrls?: string[];
    tags?: string[];
    parentPostId?: string;
    /** Alias */
    parentId?: string;
  }): Promise<Post> {
    const body = { ...payload } as Record<string, unknown>;
    if (payload.parentId && !payload.parentPostId) {
      body.parentPostId = payload.parentId;
      delete body.parentId;
    }
    const { data } = await apiClient.post('/posts', body);
    return data;
  },

  async getPost(id: string): Promise<Post> {
    const { data } = await apiClient.get(`/posts/${id}`);
    return data;
  },

  async deletePost(id: string): Promise<void> {
    await apiClient.delete(`/posts/${id}`);
  },

  async likePost(id: string): Promise<void> {
    await apiClient.post(`/posts/${id}/like`);
  },

  async unlikePost(id: string): Promise<void> {
    await apiClient.delete(`/posts/${id}/like`);
  },

  async repost(id: string): Promise<void> {
    await apiClient.post(`/posts/${id}/repost`);
  },

  async getThread(
    id: string,
  ): Promise<{ parents: Post[]; post: Post; replies: Comment[] }> {
    const { data } = await apiClient.get(`/posts/${id}/thread`);
    return data;
  },
};

// ---------------------------------------------
// Legacy individual exports (retained for compat)
// ---------------------------------------------
export const createPost = postsApi.createPost;
export const getPost = postsApi.getPost;
export const deletePost = postsApi.deletePost;
export const likePost = postsApi.likePost;
export const unlikePost = postsApi.unlikePost;
export const repost = postsApi.repost;
export const getThread = postsApi.getThread;
