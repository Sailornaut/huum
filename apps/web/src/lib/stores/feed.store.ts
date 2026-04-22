import { create } from 'zustand';
import { FeedItem } from '../types';
import * as feedApi from '../api/feed';

interface FeedState {
  posts: FeedItem[];
  perspectiveLevel: number;
  isLoading: boolean;
  hasMore: boolean;
  page: number;
  setPerspectiveLevel: (level: number) => void;
  fetchFeed: () => Promise<void>;
  fetchMore: () => Promise<void>;
  reset: () => void;
}

export const useFeedStore = create<FeedState>((set, get) => ({
  posts: [],
  perspectiveLevel: 50,
  isLoading: false,
  hasMore: true,
  page: 1,

  setPerspectiveLevel: (level) => {
    set({ perspectiveLevel: level, posts: [], page: 1, hasMore: true });
    get().fetchFeed();
  },

  fetchFeed: async () => {
    set({ isLoading: true });
    try {
      const { perspectiveLevel } = get();
      const response = await feedApi.getFeed({ page: 1, limit: 20, perspectiveLevel });
      set({ posts: response.data, hasMore: response.hasMore, page: 1, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  fetchMore: async () => {
    const { isLoading, hasMore, page, perspectiveLevel, posts } = get();
    if (isLoading || !hasMore) return;

    set({ isLoading: true });
    try {
      const nextPage = page + 1;
      const response = await feedApi.getFeed({ page: nextPage, limit: 20, perspectiveLevel });
      set({
        posts: [...posts, ...response.data],
        hasMore: response.hasMore,
        page: nextPage,
        isLoading: false,
      });
    } catch {
      set({ isLoading: false });
    }
  },

  reset: () => set({ posts: [], page: 1, hasMore: true, isLoading: false }),
}));
