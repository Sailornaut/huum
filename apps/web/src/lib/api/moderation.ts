import apiClient from './client';
import {
  Report,
  ModerationAction,
  CommunityVote,
  PaginatedResponse,
} from '../types';

// ---------------------------------------------
// Namespace API used by pages (moderationApi.*)
// ---------------------------------------------
export const moderationApi = {
  async createReport(payload: {
    reportedPostId?: string;
    reportedUserId?: string;
    category: string;
    description?: string;
    /** Legacy fields also accepted */
    targetType?: 'post' | 'comment' | 'user';
    targetId?: string;
  }): Promise<Report> {
    const body: Record<string, unknown> = { ...payload };
    // Map legacy → canonical
    if (payload.targetType && payload.targetId) {
      if (payload.targetType === 'post') body.reportedPostId = payload.targetId;
      if (payload.targetType === 'user') body.reportedUserId = payload.targetId;
      delete body.targetType;
      delete body.targetId;
    }
    const { data } = await apiClient.post('/moderation/reports', body);
    return data;
  },

  /** Returns a plain array of reports (pages iterate directly). */
  async getQueue(params?: { page?: number; status?: string }): Promise<Report[]> {
    const { data } = await apiClient.get('/moderation/queue', { params });
    return Array.isArray(data) ? data : (data?.data ?? []);
  },

  async castVote(
    reportId: string,
    payload: { vote: CommunityVote['vote'] },
  ): Promise<void> {
    await apiClient.post(`/moderation/reports/${reportId}/vote`, payload);
  },

  async takeAction(payload: {
    reportId: string;
    action: string;
    reason: string;
  }): Promise<ModerationAction> {
    const { data } = await apiClient.post(
      `/moderation/reports/${payload.reportId}/action`,
      { action: payload.action, reason: payload.reason },
    );
    return data;
  },

  async getPublicLog(params?: {
    cursor?: string;
    limit?: number;
    page?: number;
  }): Promise<PaginatedResponse<ModerationAction>> {
    const { data } = await apiClient.get('/moderation/log', { params });
    return data;
  },
};

// ---------------------------------------------
// Legacy individual exports (retained for compat)
// ---------------------------------------------
export const createReport = moderationApi.createReport;
export const getQueue = moderationApi.getQueue;
export const castVote = moderationApi.castVote;
export const takeAction = moderationApi.takeAction;
export const getPublicLog = moderationApi.getPublicLog;
