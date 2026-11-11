import type { ApiErrorPayload } from '../types/api';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '/api/v1')
  .replace(/\/+$/, '');
const TOKEN_KEY = 'rasa-kantin-token';
export const SESSION_EXPIRED_EVENT = 'rasa-kantin:session-expired';

export class ApiError extends Error {
  readonly status: number;
  readonly errors?: unknown;

  constructor(status: number, message: string, errors?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.errors = errors;
  }
}

export function getAuthToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setAuthToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearAuthToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

interface ApiRequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
  skipAuth?: boolean;
}

function isApiErrorPayload(value: unknown): value is ApiErrorPayload {
  return typeof value === 'object' && value !== null;
}

export async function apiRequest<T>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const { body, skipAuth = false, headers: requestHeaders, ...requestOptions } = options;
  const headers = new Headers(requestHeaders);
  headers.set('Accept', 'application/json');

  if (body !== undefined) {
    headers.set('Content-Type', 'application/json');
  }

  const token = skipAuth ? null : getAuthToken();
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...requestOptions,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw error;
    }
    throw new ApiError(0, 'Tidak dapat terhubung ke server. Periksa koneksi dan alamat backend.');
  }

  const responseText = await response.text();
  let payload: unknown;
  if (responseText) {
    try {
      payload = JSON.parse(responseText);
    } catch {
      if (response.ok) {
        throw new ApiError(response.status, 'Server mengirim respons yang tidak dapat dibaca.');
      }
    }
  }

  if (!response.ok) {
    const errorPayload = isApiErrorPayload(payload) ? payload : undefined;
    const message = typeof errorPayload?.message === 'string'
      ? errorPayload.message
      : response.status === 401
        ? 'Sesi tidak valid atau telah berakhir. Silakan login kembali.'
        : response.status === 403
          ? 'Kamu tidak memiliki izin untuk melakukan tindakan ini.'
          : `Permintaan gagal (HTTP ${response.status}${response.statusText ? ` ${response.statusText}` : ''}).`;

    if (response.status === 401 && token) {
      clearAuthToken();
      window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
    }

    throw new ApiError(response.status, message, errorPayload?.errors);
  }

  return payload as T;
}
