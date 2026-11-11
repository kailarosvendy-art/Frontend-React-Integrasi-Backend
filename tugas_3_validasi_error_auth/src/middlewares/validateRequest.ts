import type { RequestHandler } from 'express';
import type { ZodType } from 'zod';

type RequestSource = 'body' | 'params' | 'query';

export function validateRequest(schema: ZodType, source: RequestSource): RequestHandler {
  return (req, res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      res.status(400).json({
        status: 'fail',
        message: 'Validasi request gagal',
        errors: result.error.issues.map((issue) => ({
          path: issue.path.join('.'),
          message: issue.message,
        })),
      });
      return;
    }

    if (source === 'body') {
      req.body = result.data;
    } else {
      res.locals.validated = result.data;
    }
    next();
  };
}
