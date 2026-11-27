import { apiRequest } from './api';
import type { ApiEnvelope } from '../types/api';

export interface AuditLog {
  id: number;
  userId: number;
  userName: string;
  userEmail: string;
  action: string;
  targetTable: string;
  targetId: number;
  metadata: unknown;
  createdAt: string | null;
}

export interface AuditLogFilters {
  page: number;
  pageSize: number;
  action?: string;
  targetTable?: string;
  targetId?: number;
  userId?: number;
  from?: string;
  to?: string;
}

export interface AuditLogList {
  items: AuditLog[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export async function getAuditLogs(
  filters: AuditLogFilters,
  signal?: AbortSignal,
): Promise<AuditLogList> {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== '') query.set(key, String(value));
  }
  const response = await apiRequest<ApiEnvelope<AuditLogList>>(
    `/audit-logs?${query.toString()}`,
    { signal },
  );
  return response.data;
}

export async function getAuditLog(id: number, signal?: AbortSignal): Promise<AuditLog> {
  const response = await apiRequest<ApiEnvelope<AuditLog>>(`/audit-logs/${id}`, { signal });
  return response.data;
}
