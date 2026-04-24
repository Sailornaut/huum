import apiClient from './client';
import { Comment } from '../types';

// ---------------------------------------------
// Namespace API used by pages (commentsApi.*)
// ---------------------------------------------
export const commentsApi = {
  async createComment(payload: {
    postId: string;
    content: string;
    parentCommentId?: string;
  }): Promise<Comment> {
    const { data } = await apiClient.post('/comments', payload);
    return data;
  },

  /** Returns a plain array of threaded comments. */
  async getComments(
    postId: string,
    params?: { page?: number; limit?: number },
  ): Promise<Comment[]> {
    const { data } = await apiClient.get(`/comments/post/${postId}`, {
      params,
    });
    return Array.isArray(data) ? data : (data?.data ?? []);
  },

  async deleteComment(_postId: string, commentId: string): Promise<void> {
    await apiClient.delete(`/comments/${commentId}`);
  },

  async likeComment(_postId: string, commentId: string): Promise<void> {
    await apiClient.post(`/comments/${commentId}/like`);
  },
};

// ---------------------------------------------
// Legacy individual exports (retained for compat)
// ---------------------------------------------
export const createComment = commentsApi.createComment;
export const getComments = commentsApi.getComments;
export const deleteComment = commentsApi.deleteComment;
export const likeComment = commentsApi.likeComment;
