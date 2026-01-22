import { apiClient } from '../lib/apiClient';
import type { Application, Stage } from '../types';

export const applicationService = {
  async list(stage?: Stage): Promise<Application[]> {
    const response = await apiClient.get<Application[]>('/applications', {
      params: stage ? { stage } : undefined,
    });
    return response.data;
  },
};
