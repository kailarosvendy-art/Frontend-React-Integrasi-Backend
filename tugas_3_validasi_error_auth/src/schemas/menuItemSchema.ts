import { z } from 'zod';

export const menuItemSchema = z.object({
  stallId: z.number().int().positive().max(2147483647),
  name: z.string().trim().min(1).max(100),
  price: z.number().int().min(0).max(2147483647),
  isAvailable: z.boolean().optional(),
}).strict();

export const menuItemUpdateSchema = menuItemSchema.partial().refine(
  (value) => Object.keys(value).length > 0, 'Body update tidak boleh kosong',
);
export const menuItemIdSchema = z.object({ id: z.coerce.number().int().positive().max(2147483647) }).strict();
