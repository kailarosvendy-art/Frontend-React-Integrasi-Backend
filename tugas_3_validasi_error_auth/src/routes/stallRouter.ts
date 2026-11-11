import { Router } from 'express';
import { StallController } from '../controllers/stallController.ts';
import { authenticate, authorize } from '../middlewares/auth.ts';
import { validateRequest } from '../middlewares/validateRequest.ts';
import {
  createStallSchema,
  stallIdSchema,
  stallQuerySchema,
  updateStallSchema,
} from '../schemas/stallSchema.ts';

const stallRouter = Router();
const stallController = new StallController();

stallRouter.get('/', validateRequest(stallQuerySchema, 'query'), (req, res) => {
  // #swagger.parameters['search']   = { in: 'query', type: 'string' }
  // #swagger.parameters['category'] = { in: 'query', type: 'string' }
  // #swagger.parameters['page']     = { in: 'query', type: 'integer' }
  // #swagger.parameters['limit']    = { in: 'query', type: 'integer' }
  // #swagger.responses[200] = { description: 'Daftar warung' }
  return stallController.getStalls(req, res);
});

stallRouter.post(
  '/',
  authenticate,
  authorize('owner', 'admin'),
  validateRequest(createStallSchema, 'body'),
  (req, res) => {
    // #swagger.security = [{ bearerAuth: [] }]
    // #swagger.parameters['body'] = { in: 'body', required: true, schema: { $ref: '#/definitions/StallInput' } }
    // #swagger.responses[201] = { description: 'Warung dibuat' }
    return stallController.createStall(req, res);
  },
);

stallRouter.get('/:id', validateRequest(stallIdSchema, 'params'), (req, res) => {
  // #swagger.parameters['id'] = { in: 'path', required: true, type: 'integer' }
  // #swagger.responses[200] = { description: 'Detail warung' }
  // #swagger.responses[404] = { description: 'Tidak ditemukan' }
  return stallController.getStallById(req, res);
});

stallRouter.put(
  '/:id',
  authenticate,
  authorize('owner', 'admin'),
  validateRequest(stallIdSchema, 'params'),
  validateRequest(updateStallSchema, 'body'),
  (req, res) => {
    // #swagger.security = [{ bearerAuth: [] }]
    // #swagger.parameters['id'] = { in: 'path', required: true, type: 'integer' }
    // #swagger.parameters['body'] = { in: 'body', required: true, schema: { $ref: '#/definitions/StallInput' } }
    // #swagger.responses[200] = { description: 'Warung ter-update' }
    // #swagger.responses[404] = { description: 'Tidak ditemukan' }
    return stallController.updateStall(req, res);
  },
);

stallRouter.delete(
  '/:id',
  authenticate,
  authorize('admin'),
  validateRequest(stallIdSchema, 'params'),
  (req, res) => {
    // #swagger.security = [{ bearerAuth: [] }]
    // #swagger.parameters['id'] = { in: 'path', required: true, type: 'integer' }
    // #swagger.responses[200] = { description: 'Warung terhapus' }
    // #swagger.responses[404] = { description: 'Tidak ditemukan' }
    return stallController.deleteStall(req, res);
  },
);

stallRouter.get('/:id/menus', validateRequest(stallIdSchema, 'params'), (req, res) => {
  // #swagger.parameters['id'] = { in: 'path', required: true, type: 'integer' }
  // #swagger.responses[200] = { description: 'Daftar menu' }
  // #swagger.responses[404] = { description: 'Tidak ditemukan' }
  return stallController.getStallMenus(req, res);
});

export { stallRouter };
