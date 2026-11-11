export interface Stall {
  id: number;
  ownerId: number;
  name: string;
  category: string | null;
  location: string | null;
  description: string | null;
  avgRating: number;
  reviewCount: number;
  isPopular: boolean;
}

export interface StallInput {
  name: string;
  category: string | null;
  location: string | null;
  description: string | null;
}

export interface StallQuery {
  search?: string;
  category?: string;
  page: number;
  limit: number;
}

export interface StallListResponse {
  status: string;
  meta: {
    page: number;
    limit: number;
    total: number;
  };
  data: Stall[];
}

export interface ReviewInput {
  rating: number;
  comment: string | null;
}

export interface Review {
  id: number;
  stallId: number;
  userId: number;
  rating: number;
  comment: string | null;
  likeCount: number;
  createdAt: string | null;
  updatedAt: string | null;
  user: {
    id: number;
    name: string;
  };
}
