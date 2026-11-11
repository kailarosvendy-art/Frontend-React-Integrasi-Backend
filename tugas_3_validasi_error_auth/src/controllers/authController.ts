import type { RequestHandler } from 'express';
import { AuthService } from '../services/authService.ts';
import { getAuthUser } from '../middlewares/auth.ts';

const authService = new AuthService();

export const register: RequestHandler = async (req, res) => {
  const user = await authService.register(req.body);
  res.status(201).json({ status: 'success', data: { user } });
};

export const login: RequestHandler = async (req, res) => {
  const data = await authService.login(req.body);
  res.status(200).json({ status: 'success', data });
};

export const me: RequestHandler = (_req, res) => {
  res.status(200).json({ status: 'success', data: getAuthUser(res) });
};
