import type { RequestHandler } from 'express';
import { getAuthUser } from '../middlewares/auth.ts';
import { MenuItemService } from '../services/menuItemService.ts';

export class MenuItemController {
  constructor(private readonly menuItemService = new MenuItemService()) {}

  getMenuItems: RequestHandler = async (_req, res) => {
    res.json({ status: 'success', data: await this.menuItemService.getAllMenuItems() });
  };

  getMenuItemById: RequestHandler = async (req, res) => {
    res.json({ status: 'success', data: await this.menuItemService.getMenuItemById(Number(req.params.id)) });
  };

  createMenuItem: RequestHandler = async (req, res) => {
    const item = await this.menuItemService.createMenuItem(req.body, getAuthUser(res));
    res.status(201).json({ status: 'success', data: item });
  };

  updateMenuItem: RequestHandler = async (req, res) => {
    const item = await this.menuItemService.updateMenuItem(Number(req.params.id), req.body, getAuthUser(res));
    res.json({ status: 'success', data: item });
  };

  deleteMenuItem: RequestHandler = async (req, res) => {
    const item = await this.menuItemService.deleteMenuItem(Number(req.params.id), getAuthUser(res));
    res.json({ status: 'success', data: item });
  };
}
