import { getDb } from '../db/index.ts';
import { eq } from 'drizzle-orm';
import { users } from '../db/schema.ts';

export interface CreateUserInput {
  name: string;
  email: string;
  passwordHash: string;
}

export interface AuthUserRecord {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'owner' | 'customer';
  passwordHash: string;
}

export class UserRepository {
  async findById(id: number) {
    const db = await getDb();
    const rows = await db
      .select({ id: users.id, name: users.name })
      .from(users)
      .where(eq(users.id, id));
    return rows[0];
  }

  async findByEmail(email: string): Promise<AuthUserRecord | undefined> {
    const db = await getDb();
    const rows = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        passwordHash: users.passwordHash,
      })
      .from(users)
      .where(eq(users.email, email));
    return rows[0];
  }

  async findAll() {
    const db = await getDb();
    return db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        createdAt: users.createdAt,
      })
      .from(users)
      .orderBy(users.id);
  }

  async create(input: CreateUserInput) {
    const db = await getDb();
    const rows = await db
      .insert(users)
      .output()
      .values({
        name: input.name,
        email: input.email,
        passwordHash: input.passwordHash,
        role: 'customer',
      });
    return rows[0];
  }
}