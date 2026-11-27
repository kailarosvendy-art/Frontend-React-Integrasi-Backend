import { randomBytes } from 'node:crypto';
import { withTransaction } from '../db/transaction.ts';
import { AppError } from '../errors/AppError.ts';
import { OrderRepository, type OrderLine } from '../repositories/orderRepository.ts';
import type { CreateOrderInput } from '../schemas/orderSchema.ts';
import { AuditService } from './auditService.ts';
import type { AuthUser } from './tokenService.ts';

export class OrderService {
  constructor(
    private readonly orderRepository = new OrderRepository(),
    private readonly auditService = new AuditService(),
  ) {}

  async getAllOrders(user: AuthUser) {
    return this.orderRepository.findAll(user.role === 'admin' ? undefined : user.id);
  }

  async getOrderById(id: number, user: AuthUser) {
    const order = await this.orderRepository.findById(id);
    if (!order) throw new AppError(404, 'Pesanan tidak ditemukan');
    if (user.role !== 'admin' && order.customerId !== user.id) {
      throw new AppError(403, 'Kamu hanya bisa melihat pesanan milikmu');
    }
    return order;
  }

  async createOrder(input: CreateOrderInput, user: AuthUser) {
    if (user.role !== 'customer') throw new AppError(403, 'Hanya customer yang dapat membuat pesanan');
    return withTransaction(async (tx) => {
      const menus = await this.orderRepository.findMenus(input.items.map((item) => item.menuId), tx);
      const byId = new Map(menus.map((menu) => [menu.id, menu]));
      const lines: OrderLine[] = input.items.map((item) => {
        const menu = byId.get(item.menuId);
        if (!menu) throw new AppError(404, 'Ada menu yang tidak ditemukan');
        if (!menu.isAvailable || menu.price <= 0) throw new AppError(409, 'Ada menu yang tidak tersedia untuk dipesan');
        return {
          menuId: menu.id, menuName: menu.name, stallId: menu.stallId, stallName: menu.stallName,
          unitPrice: menu.price, quantity: item.quantity, subtotal: menu.price * item.quantity,
        };
      });
      // Harga dan total tidak pernah diterima dari client.
      const total = lines.reduce((sum, line) => sum + line.subtotal, 0);
      if (total > 2147483647) throw new AppError(400, 'Total pesanan melebihi batas');
      const orderCode = `ORD-${randomBytes(12).toString('hex')}`;
      const order = await this.orderRepository.create(input, user.id, orderCode, lines, total, tx);
      if (!order) throw new AppError(500, 'Pesanan gagal dibuat');
      await this.auditService.recordMutation({
        userId: user.id, action: 'CREATE_ORDER', targetTable: 'ORDERS', targetId: order.id,
        metadata: JSON.stringify({
          orderCode, total, itemCount: lines.length, status: order.status,
          items: lines.map(({ menuName, quantity, subtotal }) => ({ menuName, quantity, subtotal })),
        }),
      }, tx);
      return order;
    });
  }

  async updateOrderStatus(id: number, status: 'completed' | 'cancelled', user: AuthUser) {
    if (user.role !== 'admin') throw new AppError(403, 'Hanya admin yang dapat mengubah status pesanan');
    return withTransaction(async (tx) => {
      const before = await this.orderRepository.findById(id, tx);
      if (!before) throw new AppError(404, 'Pesanan tidak ditemukan');
      const updated = await this.orderRepository.updateStatus(id, status, tx);
      if (!updated) throw new AppError(409, 'Status pesanan sudah final');
      await this.auditService.recordMutation({
        userId: user.id, action: 'UPDATE_ORDER_STATUS', targetTable: 'ORDERS', targetId: id,
        metadata: JSON.stringify({ orderCode: before.orderCode, before: before.status, after: status }),
      }, tx);
      return { ...updated, items: before.items };
    });
  }
}
