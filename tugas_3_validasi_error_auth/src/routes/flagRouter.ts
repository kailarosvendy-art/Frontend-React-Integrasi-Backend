import { Router } from 'express';
import { FlagController } from '../controllers/flagController.ts';

const flagRouter = Router();
const flagController = new FlagController();

flagRouter.get('/', (_req, res) => {
  // #swagger.responses[200] = { description: 'Daftar flag beserta data pelapor dan review' }
  return flagController.getFlags(_req, res);
});

flagRouter.put('/:id', (req, res) => {
  // #swagger.parameters['id'] = { in: 'path', required: true, type: 'integer' }
  // #swagger.parameters['body'] = { in: 'body', required: true, schema: { $ref: '#/definitions/FlagStatusUpdate' } }
  // #swagger.responses[200] = { description: 'Status flag berhasil diperbarui' }
  // #swagger.responses[404] = { description: 'Flag tidak ditemukan' }
  return flagController.updateFlagStatus(req, res);
});

export { flagRouter };