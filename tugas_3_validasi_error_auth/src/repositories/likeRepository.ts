import { eq, sql } from 'drizzle-orm';
import { getDb } from '../db/index.ts';
import { likes, reviews } from '../db/schema.ts';

export interface CreateLikeInput {
  reviewId: number;
  userId: number;
}

export class LikeRepository {
  async create(input: CreateLikeInput) {
    const db = await getDb();
    const rows = await db
      .insert(likes)
      .output()
      .values({ reviewId: input.reviewId, userId: input.userId });
    const like = rows[0];
    if (!like) return undefined;

    await db
      .update(reviews)
      .set({ likeCount: sql`${reviews.likeCount} + 1` })
      .where(eq(reviews.id, input.reviewId));
    return like;
  }

  async remove(id: number) {
    const db = await getDb();
    const rows = await db.delete(likes).where(eq(likes.id, id)).output();
    const like = rows[0];
    if (!like) return undefined;

    await db
      .update(reviews)
      .set({
        likeCount: sql`CASE WHEN ${reviews.likeCount} > 0 THEN ${reviews.likeCount} - 1 ELSE 0 END`,
      })
      .where(eq(reviews.id, like.reviewId));
    return like;
  }
}