import { Router } from 'express';
import { UserController } from '../controllers/userController.ts';
import { authenticate, authorize } from '../middlewares/auth.ts';
import { validateRequest } from '../middlewares/validateRequest.ts';
import { registerSchema } from '../schemas/authSchema.ts';

const userRouter = Router();
const userController = new UserController();

userRouter.get('/', authenticate, authorize('admin'), (_req, res) => {
  // #swagger.responses[200] = { description: 'Daftar pengguna (tanpa password hash)' }
  return userController.getUsers(_req, res);
});

userRouter.post('/', validateRequest(registerSchema, 'body'), (req, res) => {
  // #swagger.parameters['body'] = { in: 'body', required: true, schema: { $ref: '#/definitions/UserInput' } }
  // #swagger.responses[201] = { description: 'Pengguna berhasil dibuat' }
  return userController.createUser(req, res);
});

export { userRouter };