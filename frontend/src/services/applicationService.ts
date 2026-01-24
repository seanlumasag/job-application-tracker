import { apiClient } from '../lib/apiClient';
import type { Application, Stage, StageEvent } from '../types';

export interface ApplicationPayload {
  company: string;
  role: string;
  jobUrl?: string | null;
  location?: string | null;
  notes?: string | null;
}

export const applicationService = {
  async list(stage?: Stage): Promise<Application[]> {
    const response = await apiClient.get<Application[]>('/applications', {
      params: stage ? { stage } : undefined,
    });
    return response.data;
  },

  async create(payload: ApplicationPayload): Promise<Application> {
    const response = await apiClient.post<Application>('/applications', payload);
    return response.data;
  },

  async update(id: number, payload: ApplicationPayload): Promise<Application> {
    const response = await apiClient.put<Application>(`/applications/${id}`, payload);
    return response.data;
  },

  async transitionStage(id: number, stage: Stage): Promise<Application> {
    const response = await apiClient.patch<Application>(`/applications/${id}/stage`, { stage });
    return response.data;
  },

  async listStageEvents(id: number): Promise<StageEvent[]> {
    const response = await apiClient.get<StageEvent[]>(`/applications/${id}/stage-events`);
    return response.data;
  },

  async remove(id: number): Promise<void> {
    await apiClient.delete(`/applications/${id}`);
  },
};
