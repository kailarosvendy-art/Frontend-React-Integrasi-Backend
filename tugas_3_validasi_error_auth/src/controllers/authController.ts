import type { Request, RequestHandler } from 'express';
import { AppError } from '../errors/AppError.ts';
import { AuditService } from '../services/auditService.ts';
import { AuthService } from '../services/authService.ts';
import { getAuthUser } from '../middlewares/auth.ts';

const authService = new AuthService();
const auditService = new AuditService();

async function writeAuthAudit(
  action: 'LOGIN' | 'LOGOUT',
  user: { id: number; role: string },
  req: Request,
  result: 'success' | 'failure' = 'success',
): Promise<void> {
  try {
    await auditService.createAuditLog({
      userId: user.id,
      action,
      targetTable: 'USERS',
      targetId: user.id,
      metadata: JSON.stringify({
        role: user.role,
        ip_address: req.ip,
        user_agent: req.get('user-agent') ?? null,
        result,
      }),
    });
  } catch (error) {
    console.error(`${action} audit log could not be written:`, error);
  }
}

export const register: RequestHandler = async (req, res) => {
  const user = await authService.register(req.body);
  res.status(201).json({ status: 'success', data: { user } });
};

export const login: RequestHandler = async (req, res) => {
  try {
    const data = await authService.login(req.body);
    await writeAuthAudit('LOGIN', data.user, req);
    res.status(200).json({ status: 'success', data });
  } catch (error) {
    if (error instanceof AppError && error.statusCode === 401) {
      try {
        const attemptedUser = await authService.findUserForLoginAudit(req.body.email);
        if (attemptedUser) await writeAuthAudit('LOGIN', attemptedUser, req, 'failure');
      } catch (auditError) {
        console.error('Failed LOGIN audit log could not be written:', auditError);
      }
    }
    throw error;
  }
};

export const logout: RequestHandler = async (req, res) => {
  const user = getAuthUser(res);
  await writeAuthAudit('LOGOUT', user, req);
  res.status(200).json({ status: 'success', message: 'Logout berhasil', data: null });
};

export const me: RequestHandler = (_req, res) => {
  res.status(200).json({ status: 'success', data: getAuthUser(res) });
};
