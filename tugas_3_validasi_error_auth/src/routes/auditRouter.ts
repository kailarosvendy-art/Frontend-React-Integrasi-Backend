import { Router } from 'express';
import { AuditController } from '../controllers/auditController.ts';
import { validateRequest } from '../middlewares/validateRequest.ts';
import { auditLogIdSchema, auditLogQuerySchema } from '../schemas/auditSchema.ts';

const auditRouter = Router();
const auditController = new AuditController();

auditRouter.get('/', validateRequest(auditLogQuerySchema, 'query'), (_req, res) => {
  // #swagger.security = [{ bearerAuth: [] }]
  // #swagger.parameters['page'] = { in: 'query', type: 'integer', default: 1 }
  // #swagger.parameters['pageSize'] = { in: 'query', type: 'integer', default: 20 }
  // #swagger.parameters['action'] = { in: 'query', type: 'string' }
  // #swagger.parameters['targetTable'] = { in: 'query', type: 'string' }
  // #swagger.parameters['targetId'] = { in: 'query', type: 'integer' }
  // #swagger.parameters['userId'] = { in: 'query', type: 'integer' }
  // #swagger.parameters['from'] = { in: 'query', type: 'string', format: 'date' }
  // #swagger.parameters['to'] = { in: 'query', type: 'string', format: 'date' }
  // #swagger.responses[200] = { description: 'Daftar audit dengan pagination' }
  // #swagger.responses[400] = { description: 'Parameter filter tidak valid' }
  return auditController.getAuditLogs(_req, res);
});

auditRouter.get('/:id', validateRequest(auditLogIdSchema, 'params'), (req, res) => {
  // #swagger.security = [{ bearerAuth: [] }]
  // #swagger.parameters['id'] = { in: 'path', required: true, type: 'integer' }
  // #swagger.responses[200] = { description: 'Detail audit log' }
  // #swagger.responses[404] = { description: 'Catatan audit tidak ditemukan' }
  return auditController.getAuditLogById(req, res);
});

export { auditRouter };