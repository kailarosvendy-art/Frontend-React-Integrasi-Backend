import { Router } from 'express';
import { AuditController } from '../controllers/auditController.ts';

const auditRouter = Router();
const auditController = new AuditController();

auditRouter.get('/', (_req, res) => {
  // #swagger.responses[200] = { description: 'Daftar audit beserta identitas user' }
  return auditController.getAuditLogs(_req, res);
});

auditRouter.post('/', (req, res) => {
  // #swagger.parameters['body'] = { in: 'body', required: true, schema: { $ref: '#/definitions/AuditInput' } }
  // #swagger.responses[201] = { description: 'Audit log berhasil dibuat' }
  // #swagger.responses[404] = { description: 'User tidak ditemukan' }
  return auditController.createAuditLog(req, res);
});

export { auditRouter };