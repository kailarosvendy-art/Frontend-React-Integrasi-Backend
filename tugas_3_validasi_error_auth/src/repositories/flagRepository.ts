import { eq } from 'drizzle-orm';
import { getDb } from '../db/index.ts';
import { flags, reviews, users } from '../db/schema.ts';

export type FlagStatus = 'pending' | 'resolved' | 'dismissed';

export class FlagRepository {
  async findAll() {
    const db = await getDb();
    return db
      .select({
        id: flags.id,
        reviewId: flags.reviewId,
        reportedBy: flags.reportedBy,
        reason: flags.reason,
        status: flags.status,
        createdAt: flags.createdAt,
        reporter: {
          id: users.id,
          name: users.name,
        },
        review: {
          rating: reviews.rating,
          comment: reviews.comment,
        },
      })
      .from(flags)
      .innerJoin(users, eq(flags.reportedBy, users.id))
      .innerJoin(reviews, eq(flags.reviewId, reviews.id))
      .orderBy(flags.id);
  }

  async updateStatus(id: number, status: FlagStatus) {
    const db = await getDb();
    const rows = await db
      .update(flags)
      .set({ status })
      .where(eq(flags.id, id))
      .output();
    if (!rows[0]) return undefined;

    const updated = await db
      .select({
        id: flags.id,
        reviewId: flags.reviewId,
        reportedBy: flags.reportedBy,
        reason: flags.reason,
        status: flags.status,
        createdAt: flags.createdAt,
        reporter: {
          id: users.id,
          name: users.name,
        },
        review: {
          rating: reviews.rating,
          comment: reviews.comment,
        },
      })
      .from(flags)
      .innerJoin(users, eq(flags.reportedBy, users.id))
      .innerJoin(reviews, eq(flags.reviewId, reviews.id))
      .where(eq(flags.id, id));
    return updated[0];
  }
}