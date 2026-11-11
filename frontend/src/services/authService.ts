import { apiRequest } from './api';
import type { ApiEnvelope } from '../types/api';
import type { LoginInput, LoginResponse, RegisterInput, User } from '../types/auth';

export async function login(input: LoginInput): Promise<LoginResponse> {
  const response = await apiRequest<ApiEnvelope<LoginResponse>>('/auth/login', {
    method: 'POST',
    body: input,
    skipAuth: true,
  });
  return response.data;
}

export async function register(input: RegisterInput): Promise<User> {
  const response = await apiRequest<ApiEnvelope<{ user: User }>>('/auth/register', {
    method: 'POST',
    body: input,
    skipAuth: true,
  });
  return response.data.user;
}

export async function getCurrentUser(): Promise<User> {
  const response = await apiRequest<ApiEnvelope<User>>('/auth/me');
  return response.data;
}
