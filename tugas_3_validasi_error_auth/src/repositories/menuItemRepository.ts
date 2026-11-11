import { eq } from 'drizzle-orm';
import { getDb } from '../db/index.ts';
import { menuItems, stalls } from '../db/schema.ts';

export interface MenuItemInput {
  stallId: number;
  name: string;
  price: number;
  isAvailable?: boolean;
}

export class MenuItemRepository {
  async findAll() {
    const db = await getDb();
    return db
      .select({
        menu: {
          id: menuItems.id,
          stallId: menuItems.stallId,
          name: menuItems.name,
          price: menuItems.price,
          isAvailable: menuItems.isAvailable,
        },
        stall: {
          id: stalls.id,
          name: stalls.name,
          category: stalls.category,
          location: stalls.location,
        },
      })
      .from(menuItems)
      .innerJoin(stalls, eq(menuItems.stallId, stalls.id))
      .orderBy(menuItems.id);
  }

  async findById(id: number) {
    const db = await getDb();
    const rows = await db
      .select({
        menu: {
          id: menuItems.id,
          stallId: menuItems.stallId,
          name: menuItems.name,
          price: menuItems.price,
          isAvailable: menuItems.isAvailable,
        },
        stall: {
          id: stalls.id,
          name: stalls.name,
          category: stalls.category,
          location: stalls.location,
        },
      })
      .from(menuItems)
      .innerJoin(stalls, eq(menuItems.stallId, stalls.id))
      .where(eq(menuItems.id, id));
    return rows[0];
  }

  async findByStallId(stallId: number) {
    const db = await getDb();
    return db.select().from(menuItems).where(eq(menuItems.stallId, stallId));
  }

  async create(input: MenuItemInput) {
    const db = await getDb();
    const rows = await db
      .insert(menuItems)
      .output()
      .values({
        stallId: input.stallId,
        name: input.name,
        price: input.price,
        isAvailable: input.isAvailable ?? true,
      });
    const id = rows[0]?.id;
    return id === undefined ? undefined : this.findById(id);
  }

  async update(id: number, input: Partial<MenuItemInput>) {
    const db = await getDb();
    const rows = await db
      .update(menuItems)
      .set({
        ...(input.stallId !== undefined ? { stallId: input.stallId } : {}),
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.price !== undefined ? { price: input.price } : {}),
        ...(input.isAvailable !== undefined ? { isAvailable: input.isAvailable } : {}),
      })
      .where(eq(menuItems.id, id))
      .output();
    return rows[0] ? this.findById(id) : undefined;
  }

  async remove(id: number) {
    const existing = await this.findById(id);
    if (!existing) return undefined;
    const db = await getDb();
    const rows = await db.delete(menuItems).where(eq(menuItems.id, id)).output();
    return rows[0] ? existing : undefined;
  }
}
