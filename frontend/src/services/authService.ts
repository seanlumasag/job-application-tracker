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

  async me(): Promise<{ userId: string; email: string }> {
    const response = await apiClient.get<{ userId: string; email: string }>('/me');
    return response.data;
  },

  async requestPasswordReset(email: string): Promise<{ message: string; token?: string | null }> {
    const response = await apiClient.post<{ message: string; token?: string | null }>(
      '/auth/password/forgot',
      { email },
    );
    return response.data;
  },

  async setupMfa(): Promise<{ secret: string; otpauthUrl: string }> {
    const response = await apiClient.post<{ secret: string; otpauthUrl: string }>('/auth/mfa/setup');
    return response.data;
  },

  async enableMfa(code: string): Promise<void> {
    await apiClient.post('/auth/mfa/enable', { code });
  },

  async disableMfa(code: string): Promise<void> {
    await apiClient.post('/auth/mfa/disable', { code });
  },

  async deleteAccount(password: string): Promise<void> {
    await apiClient.delete('/me', { data: { password } });
  },
};
