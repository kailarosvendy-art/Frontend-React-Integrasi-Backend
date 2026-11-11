import { apiRequest } from './api';
import type { ApiEnvelope } from '../types/api';
import type { Review, ReviewInput, Stall, StallInput, StallListResponse, StallQuery } from '../types/stall';

export async function getStalls(
  query: StallQuery,
  signal?: AbortSignal,
): Promise<StallListResponse> {
  const params = new URLSearchParams({
    page: String(query.page),
    limit: String(query.limit),
  });
  if (query.search) params.set('search', query.search);
  if (query.category) params.set('category', query.category);

  return apiRequest<StallListResponse>(`/stalls?${params.toString()}`, { signal });
}

export async function getStall(id: number, signal?: AbortSignal): Promise<Stall> {
  const response = await apiRequest<ApiEnvelope<Stall>>(`/stalls/${id}`, { signal });
  return response.data;
}

export async function createStall(input: StallInput): Promise<Stall> {
  const response = await apiRequest<ApiEnvelope<Stall>>('/stalls', {
    method: 'POST',
    body: input,
  });
  return response.data;
}

export async function updateStall(id: number, input: StallInput): Promise<Stall> {
  const response = await apiRequest<ApiEnvelope<Stall>>(`/stalls/${id}`, {
    method: 'PUT',
    body: input,
  });
  return response.data;
}

export async function deleteStall(id: number): Promise<Stall> {
  const response = await apiRequest<ApiEnvelope<Stall>>(`/stalls/${id}`, {
    method: 'DELETE',
  });
  return response.data;
}

export async function createReview(stallId: number, input: ReviewInput): Promise<Review> {
  const response = await apiRequest<ApiEnvelope<Review>>('/reviews', {
    method: 'POST',
    body: { ...input, stallId },
  });
  return response.data;
}

export async function getReviews(): Promise<Review[]> {
  const response = await apiRequest<ApiEnvelope<Review[]>>('/reviews');
  return response.data;
}
