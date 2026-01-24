import { apiClient } from '../lib/apiClient';
import type { AuditEvent } from '../types';

export const auditService = {
  async list(page = 0, size = 25): Promise<AuditEvent[]> {
    const response = await apiClient.get<AuditEvent[]>('/audit-events', { params: { page, size } });
    return response.data;
  },
};
