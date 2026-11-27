import { z } from 'zod';

export const orderIdSchema = z.object({ id: z.coerce.number().int().positive().max(2147483647) }).strict();

export const createOrderSchema = z.object({
  customerName: z.string().trim().min(2).max(80),
  phone: z.string().trim().max(20).regex(/^[0-9+\-\s]+$/)
    .transform((value) => value.replace(/\D/g, ''))
    .refine((value) => value.length >= 9 && value.length <= 15, 'Nomor telepon harus berisi 9-15 digit'),
  paymentMethod: z.enum(['cash', 'qris', 'transfer']),
  note: z.string().trim().max(200).default(''),
  items: z.array(z.object({
    menuId: z.number().int().positive().max(2147483647),
    quantity: z.number().int().min(1).max(20),
  }).strict()).min(1).max(20).superRefine((items, context) => {
    const seen = new Set<number>();
    items.forEach((item, index) => {
      if (seen.has(item.menuId)) context.addIssue({
        code: 'custom', path: [index, 'menuId'], message: 'Menu yang sama tidak boleh dikirim dua kali',
      });
      seen.add(item.menuId);
    });
  }),
}).strict();

export const updateOrderStatusSchema = z.object({ status: z.enum(['completed', 'cancelled']) }).strict();
export type CreateOrderInput = z.infer<typeof createOrderSchema>;
