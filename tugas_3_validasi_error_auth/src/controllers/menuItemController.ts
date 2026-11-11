import type { Request, Response } from 'express';
import type { MenuItemInput } from '../repositories/menuItemRepository.ts';
import { MenuItemService } from '../services/menuItemService.ts';

const isPositiveInteger = (value: unknown): value is number =>
  typeof value === 'number' && Number.isInteger(value) && value > 0;

const isMenuItemInput = (body: unknown): body is MenuItemInput => {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return false;
  const input = body as Record<string, unknown>;
  return (
    Object.keys(input).every((key) => ['stallId', 'name', 'price', 'isAvailable'].includes(key)) &&
    isPositiveInteger(input.stallId) &&
    typeof input.name === 'string' &&
    input.name.trim().length > 0 &&
    input.name.trim().length <= 100 &&
    typeof input.price === 'number' &&
    Number.isInteger(input.price) &&
    input.price >= 0 &&
    (input.isAvailable === undefined || typeof input.isAvailable === 'boolean')
  );
};

export class MenuItemController {
  private menuItemService: MenuItemService;

  constructor(menuItemService: MenuItemService = new MenuItemService()) {
    this.menuItemService = menuItemService;
  }

  private handleError(res: Response, error: unknown): Response {
    if (error instanceof Error && error.message === 'MENU_ITEM_NOT_FOUND') {
      return res.status(404).json({ status: 'fail', message: 'Data menu tidak ditemukan' });
    }
    if (error instanceof Error && error.message === 'STALL_NOT_FOUND') {
      return res.status(404).json({ status: 'fail', message: 'Data warung tidak ditemukan' });
    }
    return res.status(500).json({
      status: 'error',
      message: 'Terjadi kesalahan pada server',
      error: error instanceof Error ? error.message : String(error),
    });
  }

  getMenuItems = async (_req: Request, res: Response): Promise<Response> => {
    try {
      const items = await this.menuItemService.getAllMenuItems();
      return res.status(200).json({ status: 'success', data: items });
    } catch (error) {
      return this.handleError(res, error);
    }
  };

  getMenuItemById = async (req: Request, res: Response): Promise<Response> => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ status: 'fail', message: 'id harus berupa bilangan bulat positif' });
    }
    try {
      const item = await this.menuItemService.getMenuItemById(id);
      return res.status(200).json({ status: 'success', data: item });
    } catch (error) {
      return this.handleError(res, error);
    }
  };

  createMenuItem = async (req: Request, res: Response): Promise<Response> => {
    if (!isMenuItemInput(req.body)) {
      return res.status(400).json({
        status: 'fail',
        message: 'Body harus berisi stallId positif, name (maksimal 100 karakter), price integer non-negatif, dan isAvailable boolean opsional',
      });
    }
    try {
      const item = await this.menuItemService.createMenuItem({
        ...req.body,
        name: req.body.name.trim(),
      });
      return res.status(201).json({ status: 'success', data: item });
    } catch (error) {
      return this.handleError(res, error);
    }
  };

  updateMenuItem = async (req: Request, res: Response): Promise<Response> => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ status: 'fail', message: 'id harus berupa bilangan bulat positif' });
    }
    const body = req.body as Record<string, unknown>;
    const allowedKeys = ['stallId', 'name', 'price', 'isAvailable'];
    const hasFields = body && typeof body === 'object' && Object.keys(body).length > 0;
    if (
      !hasFields ||
      !Object.keys(body).every((key) => allowedKeys.includes(key)) ||
      (body.stallId !== undefined && !isPositiveInteger(body.stallId)) ||
      (body.name !== undefined &&
        (typeof body.name !== 'string' || body.name.trim().length === 0 || body.name.trim().length > 100)) ||
      (body.price !== undefined &&
        (typeof body.price !== 'number' || !Number.isInteger(body.price) || body.price < 0)) ||
      (body.isAvailable !== undefined && typeof body.isAvailable !== 'boolean')
    ) {
      return res.status(400).json({ status: 'fail', message: 'Body update tidak valid atau kosong' });
    }
    try {
      const input = {
        ...(body.stallId !== undefined ? { stallId: body.stallId as number } : {}),
        ...(body.name !== undefined ? { name: (body.name as string).trim() } : {}),
        ...(body.price !== undefined ? { price: body.price as number } : {}),
        ...(body.isAvailable !== undefined ? { isAvailable: body.isAvailable as boolean } : {}),
      };
      const item = await this.menuItemService.updateMenuItem(id, input);
      return res.status(200).json({ status: 'success', data: item });
    } catch (error) {
      return this.handleError(res, error);
    }
  };

  deleteMenuItem = async (req: Request, res: Response): Promise<Response> => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ status: 'fail', message: 'id harus berupa bilangan bulat positif' });
    }
    try {
      const item = await this.menuItemService.deleteMenuItem(id);
      return res.status(200).json({ status: 'success', data: item });
    } catch (error) {
      return this.handleError(res, error);
    }
  };
}