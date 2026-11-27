import type { Request, Response } from 'express';
import type { AuditLogQuery } from '../schemas/auditSchema.ts';
import { AuditService } from '../services/auditService.ts';

export class AuditController {
  private auditService: AuditService;

  constructor(auditService: AuditService = new AuditService()) {
    this.auditService = auditService;
  }

  private handleError(res: Response, error: unknown): Response {
    console.error('Audit log request failed:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Terjadi kesalahan pada server',
    });
  }

  getAuditLogs = async (_req: Request, res: Response): Promise<Response> => {
    try {
      const filters = res.locals.validated as AuditLogQuery;
      const auditLogs = await this.auditService.getAllAuditLogs(filters);
      return res.status(200).json({ status: 'success', data: auditLogs });
    } catch (error) {
      return this.handleError(res, error);
    }
  };

  getAuditLogById = async (req: Request, res: Response): Promise<Response> => {
    try {
      const id = Number(req.params.id);
      const audit = await this.auditService.getAuditLogById(id);
      if (!audit) {
        return res.status(404).json({ status: 'fail', message: 'Catatan audit tidak ditemukan' });
      }
      return res.status(200).json({ status: 'success', data: audit });
    } catch (error) {
      return this.handleError(res, error);
    }
  };
}