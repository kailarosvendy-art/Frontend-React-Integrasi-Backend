import type { Request, Response } from 'express';
import type { CreateReviewInput } from '../repositories/reviewRepository.ts';
import { ReviewService } from '../services/reviewService.ts';
import { getAuthUser } from '../middlewares/auth.ts';
import { AppError } from '../errors/AppError.ts';

export class ReviewController {
  private reviewService: ReviewService;

  constructor(reviewService: ReviewService = new ReviewService()) {
    this.reviewService = reviewService;
  }

  private handleError(res: Response, error: unknown): Response {
    if (error instanceof Error && error.message === 'REVIEW_NOT_FOUND') {
      return res.status(404).json({ status: 'fail', message: 'Data review tidak ditemukan' });
    }
    if (error instanceof Error && error.message === 'STALL_NOT_FOUND') {
      return res.status(404).json({ status: 'fail', message: 'Data warung tidak ditemukan' });
    }
    if (error instanceof Error && error.message === 'USER_NOT_FOUND') {
      return res.status(404).json({ status: 'fail', message: 'Data pengguna tidak ditemukan' });
    }
    if (
      error &&
      typeof error === 'object' &&
      'number' in error &&
      (error.number === 2601 || error.number === 2627)
    ) {
      return res.status(409).json({
        status: 'fail',
        message: 'Pengguna sudah memberikan review untuk warung ini',
      });
    }
    console.error('Review request failed:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Terjadi kesalahan pada server',
    });
  }

  getReviews = async (_req: Request, res: Response): Promise<Response> => {
    try {
      const reviews = await this.reviewService.getAllReviews();
      return res.status(200).json({ status: 'success', data: reviews });
    } catch (error) {
      return this.handleError(res, error);
    }
  };

  createReview = async (req: Request, res: Response): Promise<Response> => {
    try {
      const input = req.body as Omit<CreateReviewInput, 'userId'>;
      const user = getAuthUser(res);
      const review = await this.reviewService.createReview({
        ...input,
        userId: user.id,
      });
      return res.status(201).json({ status: 'success', data: review });
    } catch (error) {
      return this.handleError(res, error);
    }
  };

  deleteReview = async (req: Request, res: Response): Promise<Response> => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) throw new AppError(400, 'id harus berupa bilangan bulat positif');
    try {
      const review = await this.reviewService.deleteReview(id);
      return res.status(200).json({ status: 'success', data: review });
    } catch (error) {
      return this.handleError(res, error);
    }
  };
}