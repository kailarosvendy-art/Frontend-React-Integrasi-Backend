import type { RequestHandler, Response } from 'express';
import { AppError } from '../errors/AppError.ts';
import { verifyToken, type AuthUser, type UserRole } from '../services/tokenService.ts';

export const authenticate: RequestHandler = (req, res, next) => {
  const authorization = req.get('Authorization');
  const match = authorization?.match(/^Bearer\s+(.+)$/i);
  if (!match) {
    res.status(401).json({ status: 'fail', message: 'Token autentikasi wajib disertakan' });
    return;
  }

  try {
    res.locals.authUser = verifyToken(match[1]);
    next();
  } catch (error) {
    if (error instanceof AppError && error.statusCode === 500) {
      next(error);
      return;
    }
    res.status(401).json({ status: 'fail', message: 'Token tidak valid atau sudah kedaluwarsa' });
  }
};

export function authorize(...roles: UserRole[]): RequestHandler {
  return (_req, res, next) => {
    const user = res.locals.authUser as AuthUser | undefined;
    if (!user) {
      res.status(401).json({ status: 'fail', message: 'Autentikasi diperlukan' });
      return;
    }
    if (!roles.includes(user.role)) {
      res.status(403).json({ status: 'fail', message: 'Kamu tidak memiliki izin untuk tindakan ini' });
      return;
    }
    next();
  };
}

export function getAuthUser(res: Response): AuthUser {
  const user = res.locals.authUser as AuthUser | undefined;
  if (!user) throw new AppError(401, 'Autentikasi diperlukan');
  return user;
}
