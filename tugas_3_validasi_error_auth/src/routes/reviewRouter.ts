import { Router } from 'express';
import { ReviewController } from '../controllers/reviewController.ts';
import { authenticate, authorize } from '../middlewares/auth.ts';
import { validateRequest } from '../middlewares/validateRequest.ts';
import { createReviewSchema } from '../schemas/stallSchema.ts';

const reviewRouter = Router();
const reviewController = new ReviewController();

reviewRouter.get('/', (_req, res) => {
  // #swagger.responses[200] = { description: 'Daftar review beserta data user' }
  return reviewController.getReviews(_req, res);
});

reviewRouter.post('/', authenticate, validateRequest(createReviewSchema, 'body'), (req, res) => {
  // #swagger.parameters['body'] = { in: 'body', required: true, schema: { $ref: '#/definitions/ReviewInput' } }
  // #swagger.responses[201] = { description: 'Review berhasil dibuat beserta data user' }
  // #swagger.responses[409] = { description: 'User sudah memberi review untuk warung ini' }
  return reviewController.createReview(req, res);
});

reviewRouter.delete('/:id', authenticate, authorize('admin'), (req, res) => {
  // #swagger.parameters['id'] = { in: 'path', required: true, type: 'integer' }
  // #swagger.responses[200] = { description: 'Review berhasil dihapus' }
  // #swagger.responses[404] = { description: 'Review tidak ditemukan' }
  return reviewController.deleteReview(req, res);
});

export { reviewRouter };