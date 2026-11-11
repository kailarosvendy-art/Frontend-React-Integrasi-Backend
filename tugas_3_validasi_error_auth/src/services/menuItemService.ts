import { StallRepository } from '../repositories/stallRepository.ts';
import { MenuItemRepository, type MenuItemInput } from '../repositories/menuItemRepository.ts';

export class MenuItemService {
  private menuItemRepository: MenuItemRepository;
  private stallRepository: StallRepository;

  constructor(
    menuItemRepository: MenuItemRepository = new MenuItemRepository(),
    stallRepository: StallRepository = new StallRepository(),
  ) {
    this.menuItemRepository = menuItemRepository;
    this.stallRepository = stallRepository;
  }

  async getAllMenuItems() {
    return this.menuItemRepository.findAll();
  }

  async getMenuItemById(id: number) {
    const item = await this.menuItemRepository.findById(id);
    if (!item) throw new Error('MENU_ITEM_NOT_FOUND');
    return item;
  }

  async createMenuItem(input: MenuItemInput) {
    const stall = await this.stallRepository.findById(input.stallId);
    if (!stall) throw new Error('STALL_NOT_FOUND');
    const item = await this.menuItemRepository.create(input);
    if (!item) throw new Error('MENU_ITEM_CREATE_FAILED');
    return item;
  }

  async updateMenuItem(id: number, input: Partial<MenuItemInput>) {
    if (input.stallId !== undefined) {
      const stall = await this.stallRepository.findById(input.stallId);
      if (!stall) throw new Error('STALL_NOT_FOUND');
    }
    const item = await this.menuItemRepository.update(id, input);
    if (!item) throw new Error('MENU_ITEM_NOT_FOUND');
    return item;
  }

  async deleteMenuItem(id: number) {
    const item = await this.menuItemRepository.remove(id);
    if (!item) throw new Error('MENU_ITEM_NOT_FOUND');
    return item;
  }
}