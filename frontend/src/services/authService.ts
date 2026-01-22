import { apiClient } from '../lib/apiClient';
import type { AuthResponse } from '../types';

export const authService = {
  async signup(email: string, password: string): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/signup', { email, password });
    return response.data;
  },

  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/login', { email, password });
    return response.data;
  },
};
