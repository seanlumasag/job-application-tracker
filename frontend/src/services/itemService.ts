import { apiClient } from '../lib/apiClient';
import type { Item } from '../types';

export const itemService = {
  async getAll(): Promise<Item[]> {
    const response = await apiClient.get<Item[]>('/items');
    return response.data;
  },

  async getById(id: number): Promise<Item> {
    const response = await apiClient.get<Item>(`/items/${id}`);
    return response.data;
  },

  async create(item: Omit<Item, 'id' | 'createdAt' | 'updatedAt'>): Promise<Item> {
    const response = await apiClient.post<Item>('/items', item);
    return response.data;
  },

  async update(id: number, item: Omit<Item, 'id' | 'createdAt' | 'updatedAt'>): Promise<Item> {
    const response = await apiClient.put<Item>(`/items/${id}`, item);
    return response.data;
  },

  async delete(id: number): Promise<void> {
    await apiClient.delete(`/items/${id}`);
  },

  async checkHealth(): Promise<{ status: string; message: string }> {
    const response = await apiClient.get<{ status: string; message: string }>('/health');
    return response.data;
  },
};
