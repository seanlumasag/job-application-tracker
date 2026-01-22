import { apiClient } from '../lib/apiClient';
import type {
  DashboardActivityResponse,
  DashboardNextActionsResponse,
  DashboardSummaryResponse,
} from '../types';

export const dashboardService = {
  async summary(): Promise<DashboardSummaryResponse> {
    const response = await apiClient.get<DashboardSummaryResponse>('/dashboard/summary');
    return response.data;
  },

  async nextActions(days: number): Promise<DashboardNextActionsResponse> {
    const response = await apiClient.get<DashboardNextActionsResponse>('/dashboard/next-actions', {
      params: { days },
    });
    return response.data;
  },

  async activity(days: number): Promise<DashboardActivityResponse> {
    const response = await apiClient.get<DashboardActivityResponse>('/dashboard/activity', {
      params: { days },
    });
    return response.data;
  },
};
