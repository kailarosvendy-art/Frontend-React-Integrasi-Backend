import { and, desc, eq, inArray } from 'drizzle-orm';
import { getDb } from '../db/index.ts';
import { menuItems, orderItems, orders, stalls } from '../db/schema.ts';
import type { DbExecutor } from '../db/transaction.ts';
import type { CreateOrderInput } from '../schemas/orderSchema.ts';

export type OrderLine = Omit<typeof orderItems.$inferInsert, 'id' | 'orderId'>;

export class OrderRepository {
  async findMenus(ids: number[], tx: DbExecutor) {
    return tx.select({
      id: menuItems.id, name: menuItems.name, price: menuItems.price,
      isAvailable: menuItems.isAvailable, stallId: menuItems.stallId, stallName: stalls.name,
    }).from(menuItems).innerJoin(stalls, eq(menuItems.stallId, stalls.id))
      .where(inArray(menuItems.id, ids));
  }

  async findAll(customerId?: number) {
    const db = await getDb();
    return db.select().from(orders)
      .where(customerId === undefined ? undefined : eq(orders.customerId, customerId))
      .orderBy(desc(orders.id));
  }

  async findById(id: number, executor?: DbExecutor) {
    const db = executor ?? await getDb();
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    if (!order) return undefined;
    const items = await db.select().from(orderItems).where(eq(orderItems.orderId, id)).orderBy(orderItems.id);
    return { ...order, items };
  }

  async create(input: CreateOrderInput, customerId: number, orderCode: string, lines: OrderLine[], total: number, tx: DbExecutor) {
    const [order] = await tx.insert(orders).output().values({
      orderCode, customerId, customerName: input.customerName, phone: input.phone,
      paymentMethod: input.paymentMethod, note: input.note, total, status: 'confirmed',
    });
    if (!order) throw new Error('ORDER_CREATE_FAILED');
    await tx.insert(orderItems).values(lines.map((line) => ({ ...line, orderId: order.id })));
    return this.findById(order.id, tx);
  }

  async updateStatus(id: number, status: 'completed' | 'cancelled', tx: DbExecutor) {
    const [updated] = await tx.update(orders).set({ status })
      .where(and(eq(orders.id, id), eq(orders.status, 'confirmed'))).output();
    return updated;
  }
}
