import type { Request, Response } from 'express';
import { StallService } from '../services/stallService.ts';
import { getAuthUser } from '../middlewares/auth.ts';
import { AppError } from '../errors/AppError.ts';
import type { z } from 'zod';
import { stallQuerySchema, createStallSchema, updateStallSchema } from '../schemas/stallSchema.ts';

type StallQuery = z.infer<typeof stallQuerySchema>;
type CreateStallBody = z.infer<typeof createStallSchema>;
type UpdateStallBody = z.infer<typeof updateStallSchema>;

export class StallController {
  private stallService: StallService;

  constructor(stallService: StallService = new StallService()) {
    this.stallService = stallService;
  }

  private handleError(res: Response, error: unknown): Response {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({
        status: 'fail',
        message: error.message,
        ...(error.details !== undefined ? { errors: error.details } : {}),
      });
    }
    if (error instanceof Error && error.message === 'STALL_NOT_FOUND') {
      return res.status(404).json({ status: 'fail', message: 'Data warung tidak ditemukan' });
    }
    if (typeof error === 'object' && error !== null && 'number' in error && error.number === 547) {
      return res.status(409).json({
        status: 'fail',
        message: 'Warung tidak dapat dihapus karena masih memiliki data terkait',
      });
    }
    console.error('Stall request failed:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Terjadi kesalahan pada server',
    });
  }

  getStalls = async (req: Request, res: Response): Promise<Response> => {
    try {
      const { page, limit, search, category } = res.locals.validated as StallQuery;

      const { data, total } = await this.stallService.getAllStalls({
        search,
        category,
        page,
        limit,
      });

      return res.status(200).json({ status: 'success', meta: { page, limit, total }, data });
    } catch (error) {
      return this.handleError(res, error);
    }
  };

  getStallById = async (req: Request, res: Response): Promise<Response> => {
    try {
      const stall = await this.stallService.getStallById(Number(req.params.id));
      return res.status(200).json({ status: 'success', data: stall });
    } catch (error) {
      return this.handleError(res, error);
    }
  };

  getStallMenus = async (req: Request, res: Response): Promise<Response> => {
    try {
      const menus = await this.stallService.getStallMenus(Number(req.params.id));
      return res.status(200).json({ status: 'success', data: menus });
    } catch (error) {
      return this.handleError(res, error);
    }
  };

  createStall = async (req: Request, res: Response): Promise<Response> => {
    try {
      const input = req.body as CreateStallBody;
      const user = getAuthUser(res);
      const stall = await this.stallService.createStall(input, user.id);
      return res.status(201).json({ status: 'success', data: stall });
    } catch (error) {
      return this.handleError(res, error);
    }
  };

  updateStall = async (req: Request, res: Response): Promise<Response> => {
    try {
      const input = req.body as UpdateStallBody;
      const user = getAuthUser(res);
      const stall = await this.stallService.updateStall(Number(req.params.id), input, user);
      return res.status(200).json({ status: 'success', data: stall });
    } catch (error) {
      return this.handleError(res, error);
    }
  };

  deleteStall = async (req: Request, res: Response): Promise<Response> => {
    try {
      const stall = await this.stallService.deleteStall(Number(req.params.id));
      return res.status(200).json({ status: 'success', data: stall });
    } catch (error) {
      return this.handleError(res, error);
    }
  };
}
