export interface ApiEnvelope<T> {
  status: string;
  data: T;
}

export interface PageMeta {
  page: number;
  limit: number;
  total: number;
}

export interface ApiErrorPayload {
  status?: string;
  message?: string;
  errors?: unknown;
}
