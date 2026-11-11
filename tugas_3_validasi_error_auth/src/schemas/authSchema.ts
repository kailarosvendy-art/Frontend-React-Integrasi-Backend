import { z } from 'zod';

const email = z.string().trim().toLowerCase().email('format email tidak valid').max(150);
const password = z.string()
  .min(8, 'password minimal 8 karakter')
  .max(72)
  .refine((value) => Buffer.byteLength(value, 'utf8') <= 72, 'password maksimal 72 byte');

export const registerSchema = z.object({
  name: z.string().trim().min(3, 'nama minimal 3 karakter').max(100),
  email,
  password,
}).strict();

export const loginSchema = z.object({
  email,
  password: z.string().min(1, 'password wajib diisi').max(72)
    .refine((value) => Buffer.byteLength(value, 'utf8') <= 72, 'password maksimal 72 byte'),
}).strict();
