import { StallRepository } from '../repositories/stallRepository.ts';
import { MenuItemRepository, type MenuItemInput } from '../repositories/menuItemRepository.ts';
import { withTransaction, type DbExecutor } from '../db/transaction.ts';
import { AppError } from '../errors/AppError.ts';
import { AuditService } from './auditService.ts';
import type { AuthUser } from './tokenService.ts';

export class MenuItemService {
  constructor(
    private readonly menuItemRepository = new MenuItemRepository(),
    private readonly stallRepository = new StallRepository(),
    private readonly auditService = new AuditService(),
  ) {}

  async getAllMenuItems() {
    return this.menuItemRepository.findAll();
  }

  async getMenuItemById(id: number, tx?: DbExecutor) {
    const item = await this.menuItemRepository.findById(id, tx);
    if (!item) throw new AppError(404, 'Data menu tidak ditemukan');
    return item;
  }

  private async authorizeStall(stallId: number, user: AuthUser, tx: DbExecutor) {
    const stall = await this.stallRepository.findById(stallId, tx);
    if (!stall) throw new AppError(404, 'Data warung tidak ditemukan');
    if (user.role !== 'admin' && (user.role !== 'owner' || stall.ownerId !== user.id)) {
      throw new AppError(403, 'Kamu hanya bisa mengelola menu warung milikmu');
    }
  }

  async createMenuItem(input: MenuItemInput, user: AuthUser) {
    return withTransaction(async (tx) => {
      await this.authorizeStall(input.stallId, user, tx);
      const item = await this.menuItemRepository.create(input, tx);
      if (!item) throw new AppError(500, 'Menu gagal dibuat');
      await this.auditService.recordMutation({
        userId: user.id, action: 'CREATE_MENU', targetTable: 'MENU_ITEMS',
        targetId: item.menu.id, metadata: JSON.stringify({ after: item.menu }),
      }, tx);
      return item;
    });
  }

  async updateMenuItem(id: number, input: Partial<MenuItemInput>, user: AuthUser) {
    return withTransaction(async (tx) => {
      const before = await this.getMenuItemById(id, tx);
      await this.authorizeStall(before.menu.stallId, user, tx);
      if (input.stallId !== undefined) await this.authorizeStall(input.stallId, user, tx);
      const item = await this.menuItemRepository.update(id, input, tx);
      if (!item) throw new AppError(404, 'Data menu tidak ditemukan');
      await this.auditService.recordMutation({
        userId: user.id, action: 'UPDATE_MENU', targetTable: 'MENU_ITEMS', targetId: id,
        metadata: JSON.stringify({ before: before.menu, after: item.menu }),
      }, tx);
      return item;
    });
  }

  async deleteMenuItem(id: number, user: AuthUser) {
    return withTransaction(async (tx) => {
      const before = await this.getMenuItemById(id, tx);
      await this.authorizeStall(before.menu.stallId, user, tx);
      const item = await this.menuItemRepository.remove(id, tx);
      if (!item) throw new AppError(404, 'Data menu tidak ditemukan');
      await this.auditService.recordMutation({
        userId: user.id, action: 'DELETE_MENU', targetTable: 'MENU_ITEMS', targetId: id,
        metadata: JSON.stringify({ before: item.menu }),
      }, tx);
      return item;
    });
  }
}
