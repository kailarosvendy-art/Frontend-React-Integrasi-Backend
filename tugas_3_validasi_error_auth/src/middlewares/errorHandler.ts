import type { ErrorRequestHandler } from 'express';
import { AppError } from '../errors/AppError.ts';

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof AppError) {
    res.status(error.statusCode).json({
      status: 'fail',
      message: error.message,
      ...(error.details !== undefined ? { errors: error.details } : {}),
    });
    return;
  }

  if (
    error instanceof SyntaxError &&
    'status' in error &&
    error.status === 400 &&
    'type' in error &&
    error.type === 'entity.parse.failed'
  ) {
    res.status(400).json({ status: 'fail', message: 'JSON pada request body tidak valid' });
    return;
  }

  const dbError = error as { number?: number };
  if (dbError.number === 2601 || dbError.number === 2627) {
    res.status(409).json({ status: 'fail', message: 'Email sudah terdaftar' });
    return;
  }

  console.error('Unhandled error:', error);
  res.status(500).json({ status: 'error', message: 'Terjadi kesalahan pada server' });
};
