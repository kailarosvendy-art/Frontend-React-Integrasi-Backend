import { Router } from 'express';
import { login, me, register } from '../controllers/authController.ts';
import { authenticate } from '../middlewares/auth.ts';
import { validateRequest } from '../middlewares/validateRequest.ts';
import { loginSchema, registerSchema } from '../schemas/authSchema.ts';

const authRouter = Router();

authRouter.post('/register', (req, res, next) => {
  // #swagger.tags = ['Auth']
  // #swagger.parameters['body'] = { in: 'body', required: true, schema: { $ref: '#/definitions/RegisterInput' } }
  // #swagger.responses[201] = { description: 'Akun customer berhasil dibuat' }
  // #swagger.responses[409] = { description: 'Email sudah terdaftar' }
  return validateRequest(registerSchema, 'body')(req, res, next);
}, register);
authRouter.post('/login', (req, res, next) => {
  // #swagger.tags = ['Auth']
  // #swagger.parameters['body'] = { in: 'body', required: true, schema: { $ref: '#/definitions/AuthInput' } }
  // #swagger.responses[200] = { description: 'Login berhasil', schema: { $ref: '#/definitions/LoginResponse' } }
  // #swagger.responses[401] = { description: 'Kredensial tidak valid' }
  return validateRequest(loginSchema, 'body')(req, res, next);
}, login);
authRouter.get('/me', authenticate, (req, res, next) => {
  // #swagger.tags = ['Auth']
  // #swagger.security = [{ bearerAuth: [] }]
  // #swagger.responses[200] = { description: 'Informasi pengguna aktif' }
  return next();
}, me);

export { authRouter };
