import { z } from 'zod';

const optionalText = (max: number) => z.string().trim().min(1).max(max).optional();

const calendarDate = z.string().refine((value) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  if (Number(value.slice(0, 4)) < 1) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}, 'Tanggal harus berupa tanggal kalender yang valid dengan format YYYY-MM-DD');

export const auditLogQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  action: optionalText(50),
  targetTable: optionalText(50),
  targetId: z.coerce.number().int().positive().optional(),
  userId: z.coerce.number().int().positive().optional(),
  from: calendarDate.optional(),
  to: calendarDate.optional(),
}).strict().superRefine((query, context) => {
  if (query.from && query.to && query.from > query.to) {
    context.addIssue({
      code: 'custom',
      path: ['from'],
      message: 'Tanggal from tidak boleh setelah tanggal to',
    });
  }
});

export const auditLogIdSchema = z.object({
  id: z.coerce.number().int().positive(),
}).strict();

export type AuditLogQuery = z.infer<typeof auditLogQuerySchema>;
