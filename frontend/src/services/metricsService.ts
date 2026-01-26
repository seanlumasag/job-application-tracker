import { apiClient } from '../lib/apiClient';
import type { MetricsResponse } from '../types';

export const metricsService = {
  async get(): Promise<MetricsResponse> {
    const response = await apiClient.get<MetricsResponse>('/metrics');
    return response.data;
  },
};
