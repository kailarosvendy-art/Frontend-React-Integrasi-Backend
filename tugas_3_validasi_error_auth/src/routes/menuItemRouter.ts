import { Router } from 'express';
import { MenuItemController } from '../controllers/menuItemController.ts';
import { authenticate, authorize } from '../middlewares/auth.ts';
import { validateRequest } from '../middlewares/validateRequest.ts';
import { menuItemSchema, menuItemUpdateSchema, menuItemIdSchema } from '../schemas/menuItemSchema.ts';

const menuItemRouter = Router();
const menuItemController = new MenuItemController();

menuItemRouter.get('/', (_req, res, next) => {
  // #swagger.responses[200] = { description: 'Daftar menu beserta data warung' }
  return menuItemController.getMenuItems(_req, res, next);
});

menuItemRouter.post('/', authenticate, authorize('admin', 'owner'), validateRequest(menuItemSchema, 'body'), (req, res, next) => {
  // #swagger.security = [{ bearerAuth: [] }]
  // #swagger.parameters['body'] = { in: 'body', required: true, schema: { $ref: '#/definitions/MenuItemInput' } }
  // #swagger.responses[201] = { description: 'Menu berhasil dibuat beserta data warung' }
  return menuItemController.createMenuItem(req, res, next);
});

menuItemRouter.get('/:id', validateRequest(menuItemIdSchema, 'params'), (req, res, next) => {
  // #swagger.parameters['id'] = { in: 'path', required: true, type: 'integer' }
  // #swagger.responses[200] = { description: 'Detail menu beserta data warung' }
  // #swagger.responses[404] = { description: 'Menu tidak ditemukan' }
  return menuItemController.getMenuItemById(req, res, next);
});

menuItemRouter.put('/:id', authenticate, authorize('admin', 'owner'), validateRequest(menuItemIdSchema, 'params'), validateRequest(menuItemUpdateSchema, 'body'), (req, res, next) => {
  // #swagger.security = [{ bearerAuth: [] }]
  // #swagger.parameters['id'] = { in: 'path', required: true, type: 'integer' }
  // #swagger.parameters['body'] = { in: 'body', required: true, schema: { $ref: '#/definitions/MenuItemUpdate' } }
  // #swagger.responses[200] = { description: 'Menu berhasil diubah beserta data warung' }
  // #swagger.responses[404] = { description: 'Menu atau warung tidak ditemukan' }
  return menuItemController.updateMenuItem(req, res, next);
});

menuItemRouter.delete('/:id', authenticate, authorize('admin', 'owner'), validateRequest(menuItemIdSchema, 'params'), (req, res, next) => {
  // #swagger.security = [{ bearerAuth: [] }]
  // #swagger.parameters['id'] = { in: 'path', required: true, type: 'integer' }
  // #swagger.responses[200] = { description: 'Menu berhasil dihapus' }
  // #swagger.responses[404] = { description: 'Menu tidak ditemukan' }
  return menuItemController.deleteMenuItem(req, res, next);
});

export { menuItemRouter };
