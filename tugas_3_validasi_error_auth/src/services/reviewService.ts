import { StallRepository } from '../repositories/stallRepository.ts';
import { ReviewRepository, type CreateReviewInput } from '../repositories/reviewRepository.ts';
import { UserRepository } from '../repositories/userRepository.ts';
import { withTransaction } from '../db/transaction.ts';
import { AuditService } from './auditService.ts';
import type { AuthUser } from './tokenService.ts';

export class ReviewService {
  private reviewRepository: ReviewRepository;
  private stallRepository: StallRepository;
  private userRepository: UserRepository;
  private auditService: AuditService;
  private runInTransaction: typeof withTransaction;

  constructor(
    reviewRepository: ReviewRepository = new ReviewRepository(),
    stallRepository: StallRepository = new StallRepository(),
    userRepository: UserRepository = new UserRepository(),
    auditService: AuditService = new AuditService(),
    runInTransaction: typeof withTransaction = withTransaction,
  ) {
    this.reviewRepository = reviewRepository;
    this.stallRepository = stallRepository;
    this.userRepository = userRepository;
    this.auditService = auditService;
    this.runInTransaction = runInTransaction;
  }

  async getAllReviews() {
    return this.reviewRepository.findAll();
  }

  async createReview(input: CreateReviewInput) {
    return this.runInTransaction(async (tx) => {
      const stall = await this.stallRepository.findById(input.stallId, tx);
      if (!stall) throw new Error('STALL_NOT_FOUND');
      const user = await this.userRepository.findById(input.userId, tx);
      if (!user) throw new Error('USER_NOT_FOUND');
      const review = await this.reviewRepository.create(input, tx);
      if (!review) throw new Error('REVIEW_CREATE_FAILED');
      await this.auditService.recordMutation({
        userId: input.userId,
        action: 'CREATE_REVIEW',
        targetTable: 'REVIEWS',
        targetId: review.id,
        metadata: JSON.stringify({
          fields: Object.keys(input).filter((field) => field !== 'userId'),
        }),
      }, tx);
      return review;
    });
  }

  async deleteReview(id: number, user: AuthUser) {
    return this.runInTransaction(async (tx) => {
      const review = await this.reviewRepository.remove(id, tx);
      if (!review) throw new Error('REVIEW_NOT_FOUND');
      await this.auditService.recordMutation({
        userId: user.id,
        action: 'DELETE_REVIEW',
        targetTable: 'REVIEWS',
        targetId: id,
        metadata: JSON.stringify({ changedFields: ['deleted'] }),
      }, tx);
      return review;
    });
  }
}