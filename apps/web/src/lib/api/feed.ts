import apiClient from './client';
import { FeedItem, PaginatedResponse, Post } from '../types';

// ---------------------------------------------
// Namespace API used by pages (feedApi.*)
// ---------------------------------------------
export const feedApi = {
  async getFeed(params: {
    page?: number;
    limit?: number;
    cursor?: string;
    perspectiveLevel?: number;
  }): Promise<PaginatedResponse<FeedItem>> {
    const { data } = await apiClient.get('/feed', { params });
    const items = Array.isArray(data) ? data : (data?.data ?? []);
    return {
      data: items,
      hasMore: data?.hasMore ?? items.length === (params.limit ?? 20),
      nextCursor: data?.nextCursor,
    };
  },

  async getTrending(): Promise<{ topics: { tag: string; count: number }[] }> {
    const { data } = await apiClient.get('/feed/trending');
    return data;
  },

  async getExplore(params: {
    page?: number;
    query?: string;
    tag?: string;
  }): Promise<PaginatedResponse<Post>> {
    const { data } = await apiClient.get('/feed/explore', { params });
    const items = Array.isArray(data) ? data : (data?.data ?? []);
    return {
      data: items,
      hasMore: data?.hasMore ?? items.length === 20,
      nextCursor: data?.nextCursor,
    };
  },
};

// ---------------------------------------------
// Legacy individual exports (retained for compat)
// ---------------------------------------------
export const getFeed = feedApi.getFeed;
export const getTrending = feedApi.getTrending;
export const getExplore = feedApi.getExplore;
