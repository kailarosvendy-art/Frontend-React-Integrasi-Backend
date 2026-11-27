import { Router } from 'express';
import { OrderController } from '../controllers/orderController.ts';
import { authenticate, authorize } from '../middlewares/auth.ts';
import { validateRequest } from '../middlewares/validateRequest.ts';
import { createOrderSchema, orderIdSchema, updateOrderStatusSchema } from '../schemas/orderSchema.ts';

const orderRouter = Router();
const controller = new OrderController();
orderRouter.use(authenticate);

orderRouter.get('/', authorize('admin', 'customer'), (req, res, next) => {
  // #swagger.security = [{ bearerAuth: [] }]
  // #swagger.responses[200] = { description: 'Daftar pesanan; customer hanya melihat pesanan sendiri' }
  return controller.getOrders(req, res, next);
});
orderRouter.post('/', authorize('customer'), validateRequest(createOrderSchema, 'body'), (req, res, next) => {
  // #swagger.security = [{ bearerAuth: [] }]
  // #swagger.parameters['body'] = { in: 'body', required: true, schema: { $ref: '#/definitions/OrderInput' } }
  // #swagger.responses[201] = { description: 'Pesanan dan audit tersimpan dalam satu transaksi' }
  return controller.createOrder(req, res, next);
});
orderRouter.get('/:id', authorize('admin', 'customer'), validateRequest(orderIdSchema, 'params'), (req, res, next) => {
  // #swagger.security = [{ bearerAuth: [] }]
  // #swagger.responses[200] = { description: 'Detail pesanan dan snapshot item' }
  return controller.getOrder(req, res, next);
});
orderRouter.patch('/:id/status', authorize('admin'), validateRequest(orderIdSchema, 'params'), validateRequest(updateOrderStatusSchema, 'body'), (req, res, next) => {
  // #swagger.security = [{ bearerAuth: [] }]
  // #swagger.parameters['body'] = { in: 'body', required: true, schema: { status: 'completed' } }
  // #swagger.responses[200] = { description: 'Status dan audit diperbarui dalam satu transaksi' }
  // #swagger.responses[409] = { description: 'Status pesanan sudah final' }
  return controller.updateStatus(req, res, next);
});

export { orderRouter };
