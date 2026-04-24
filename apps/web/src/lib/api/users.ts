import apiClient from './client';
import { User, UserPreferences, BeliefTag, Post } from '../types';

// ---------------------------------------------
// Namespace API used by pages (usersApi.*)
// ---------------------------------------------
export const usersApi = {
  async getProfile(username: string): Promise<User> {
    const { data } = await apiClient.get(`/users/${username}`);
    return data;
  },

  async getUserPosts(username: string): Promise<Post[]> {
    const profile = await usersApi.getProfile(username);
    const { data } = await apiClient.get(`/posts/user/${profile.id}`);
    // Accept either paginated or plain array
    return Array.isArray(data) ? data : (data?.data ?? []);
  },

  async updateProfile(payload: {
    displayName?: string;
    bio?: string;
    avatarUrl?: string;
    bannerUrl?: string;
    profileFont?: 'sans' | 'serif' | 'mono' | 'display';
  }): Promise<User> {
    const { data } = await apiClient.patch('/users/me', payload);
    return data;
  },

  async follow(userId: string): Promise<void> {
    await apiClient.post(`/users/${userId}/follow`);
  },

  async unfollow(userId: string): Promise<void> {
    await apiClient.delete(`/users/${userId}/follow`);
  },

  async getFollowers(
    userId: string,
    page = 1,
  ): Promise<{ data: User[]; hasMore: boolean }> {
    const { data } = await apiClient.get(`/users/${userId}/followers`, {
      params: { page },
    });
    return data;
  },

  async getFollowing(
    userId: string,
    page = 1,
  ): Promise<{ data: User[]; hasMore: boolean }> {
    const { data } = await apiClient.get(`/users/${userId}/following`, {
      params: { page },
    });
    return data;
  },

  async updatePreferences(
    prefs: Partial<UserPreferences>,
  ): Promise<UserPreferences> {
    const { data } = await apiClient.patch('/users/me/preferences', prefs);
    return data;
  },

  async setBeliefTags(tagIdsOrSlugs: (string | number)[]): Promise<BeliefTag[]> {
    const { data } = await apiClient.put('/users/me/belief-tags', {
      tagIds: tagIdsOrSlugs,
    });
    return data;
  },
};

// ---------------------------------------------
// Legacy individual exports (retained for compat)
// ---------------------------------------------
export const getProfile = usersApi.getProfile;
export const updateProfile = usersApi.updateProfile;
export const follow = usersApi.follow;
export const unfollow = usersApi.unfollow;
export const getFollowers = usersApi.getFollowers;
export const getFollowing = usersApi.getFollowing;
export const updatePreferences = usersApi.updatePreferences;
export const setBeliefTags = usersApi.setBeliefTags;
