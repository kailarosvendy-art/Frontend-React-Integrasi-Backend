import { and, count, desc, eq, gte, lt, type SQL } from 'drizzle-orm';
import { getDb } from '../db/index.ts';
import type { DbExecutor } from '../db/transaction.ts';
import { auditLogs, users } from '../db/schema.ts';
import type { AuditLogQuery } from '../schemas/auditSchema.ts';

export interface CreateAuditInput {
  userId: number;
  action: string;
  targetTable: string;
  targetId: number;
  metadata?: string | null;
}

export class AuditRepository {
  async findAll(filters: AuditLogQuery) {
    const db = await getDb();
    const conditions: SQL[] = [];
    if (filters.action) conditions.push(eq(auditLogs.action, filters.action));
    if (filters.targetTable) conditions.push(eq(auditLogs.targetTable, filters.targetTable));
    if (filters.targetId !== undefined) conditions.push(eq(auditLogs.targetId, filters.targetId));
    if (filters.userId !== undefined) conditions.push(eq(auditLogs.userId, filters.userId));
    if (filters.from) conditions.push(gte(auditLogs.createdAt, new Date(`${filters.from}T00:00:00.000Z`)));
    if (filters.to) {
      const endExclusive = new Date(`${filters.to}T00:00:00.000Z`);
      endExclusive.setUTCDate(endExclusive.getUTCDate() + 1);
      conditions.push(lt(auditLogs.createdAt, endExclusive));
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;
    const [items, totals] = await Promise.all([
      db
        .select({
          id: auditLogs.id,
          userId: auditLogs.userId,
          action: auditLogs.action,
          targetTable: auditLogs.targetTable,
          targetId: auditLogs.targetId,
          metadata: auditLogs.metadata,
          createdAt: auditLogs.createdAt,
          userName: users.name,
          userEmail: users.email,
        })
        .from(auditLogs)
        .innerJoin(users, eq(auditLogs.userId, users.id))
        .where(where)
        .orderBy(desc(auditLogs.createdAt), desc(auditLogs.id))
        .offset((filters.page - 1) * filters.pageSize)
        .fetch(filters.pageSize),
      db
        .select({ total: count() })
        .from(auditLogs)
        .where(where),
    ]);

    return { items, total: Number(totals[0]?.total ?? 0) };
  }

  async findById(id: number) {
    const db = await getDb();
    const rows = await db
      .select({
        id: auditLogs.id,
        userId: auditLogs.userId,
        action: auditLogs.action,
        targetTable: auditLogs.targetTable,
        targetId: auditLogs.targetId,
        metadata: auditLogs.metadata,
        createdAt: auditLogs.createdAt,
        userName: users.name,
        userEmail: users.email,
      })
      .from(auditLogs)
      .innerJoin(users, eq(auditLogs.userId, users.id))
      .where(eq(auditLogs.id, id));
    return rows[0];
  }

  async create(input: CreateAuditInput, executor?: DbExecutor) {
    const db = executor ?? await getDb();
    const rows = await db
      .insert(auditLogs)
      .output()
      .values({
        userId: input.userId,
        action: input.action,
        targetTable: input.targetTable,
        targetId: input.targetId,
        metadata: input.metadata ?? null,
      });
    const audit = rows[0];
    if (!audit) return undefined;

    const result = await db
      .select({
        id: auditLogs.id,
        userId: auditLogs.userId,
        action: auditLogs.action,
        targetTable: auditLogs.targetTable,
        targetId: auditLogs.targetId,
        metadata: auditLogs.metadata,
        createdAt: auditLogs.createdAt,
        userName: users.name,
        userEmail: users.email,
      })
      .from(auditLogs)
      .innerJoin(users, eq(auditLogs.userId, users.id))
      .where(eq(auditLogs.id, audit.id));
    return result[0];
  }
}
