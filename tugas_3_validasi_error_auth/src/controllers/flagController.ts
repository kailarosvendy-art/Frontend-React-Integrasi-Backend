import type { Request, Response } from 'express';
import type { FlagStatus } from '../repositories/flagRepository.ts';
import { FlagService } from '../services/flagService.ts';

const flagStatuses: FlagStatus[] = ['pending', 'resolved', 'dismissed'];

const isPositiveInteger = (value: unknown): value is number =>
  typeof value === 'number' && Number.isInteger(value) && value > 0;

export class FlagController {
  private flagService: FlagService;

  constructor(flagService: FlagService = new FlagService()) {
    this.flagService = flagService;
  }

  private handleError(res: Response, error: unknown): Response {
    if (error instanceof Error && error.message === 'FLAG_NOT_FOUND') {
      return res.status(404).json({ status: 'fail', message: 'Data flag tidak ditemukan' });
    }
    return res.status(500).json({
      status: 'error',
      message: 'Terjadi kesalahan pada server',
      error: error instanceof Error ? error.message : String(error),
    });
  }

  getFlags = async (_req: Request, res: Response): Promise<Response> => {
    try {
      const flags = await this.flagService.getAllFlags();
      return res.status(200).json({ status: 'success', data: flags });
    } catch (error) {
      return this.handleError(res, error);
    }
  };

  updateFlagStatus = async (req: Request, res: Response): Promise<Response> => {
    const id = Number(req.params.id);
    if (!isPositiveInteger(id)) {
      return res.status(400).json({ status: 'fail', message: 'id harus berupa bilangan bulat positif' });
    }
    const body = req.body as Record<string, unknown>;
    if (
      !body ||
      typeof body !== 'object' ||
      Array.isArray(body) ||
      Object.keys(body).length !== 1 ||
      !Object.hasOwn(body, 'status') ||
      typeof body.status !== 'string' ||
      !flagStatuses.includes(body.status as FlagStatus)
    ) {
      return res.status(400).json({
        status: 'fail',
        message: 'status wajib berupa pending, resolved, atau dismissed',
      });
    }
    try {
      const flag = await this.flagService.updateFlagStatus(id, body.status as FlagStatus);
      return res.status(200).json({ status: 'success', data: flag });
    } catch (error) {
      return this.handleError(res, error);
    }
  };
}