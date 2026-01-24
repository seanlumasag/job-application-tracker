import { apiClient } from '../lib/apiClient';
import type { Task, TaskStatus } from '../types';

export interface TaskPayload {
  title: string;
  dueAt?: string | null;
  snoozeUntil?: string | null;
  notes?: string | null;
}

export const taskService = {
  async listForApplication(applicationId: number): Promise<Task[]> {
    const response = await apiClient.get<Task[]>(`/applications/${applicationId}/tasks`);
    return response.data;
  },

  async create(applicationId: number, payload: TaskPayload): Promise<Task> {
    const response = await apiClient.post<Task>(`/applications/${applicationId}/tasks`, payload);
    return response.data;
  },

  async update(id: number, payload: TaskPayload): Promise<Task> {
    const response = await apiClient.put<Task>(`/tasks/${id}`, payload);
    return response.data;
  },

  async updateStatus(id: number, status: TaskStatus): Promise<Task> {
    const response = await apiClient.patch<Task>(`/tasks/${id}/status`, { status });
    return response.data;
  },
};
