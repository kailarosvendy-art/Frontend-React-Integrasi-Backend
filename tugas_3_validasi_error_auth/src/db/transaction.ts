import { getDb } from './index.ts';

export type DbExecutor = Pick<Awaited<ReturnType<typeof getDb>>,
  'select' | 'insert' | 'update' | 'delete' | 'execute'>;

// Semua repository di callback menerima transaksi yang sama.
export async function withTransaction<T>(work: (tx: DbExecutor) => Promise<T>): Promise<T> {
  const db = await getDb();
  return db.transaction(work, { isolationLevel: 'serializable' });
}
