import { z } from 'zod';

const optionalText = (max: number) => z.string().trim().max(max).nullable().optional();

export const stallIdSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const stallQuerySchema = z.object({
  search: z.string().trim().max(100).optional(),
  category: z.string().trim().max(50).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

export const createStallSchema = z.object({
  name: z.string().trim().min(3, 'nama warung minimal 3 karakter').max(100),
  category: optionalText(50),
  location: optionalText(100),
  description: optionalText(1000),
}).strict();

export const updateStallSchema = createStallSchema.partial();

export const createReviewSchema = z.object({
  stallId: z.coerce.number().int().positive(),
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().trim().max(1000).nullable().optional(),
}).strict();
