import { StallRepository } from '../repositories/stallRepository.ts';
import { ReviewRepository, type CreateReviewInput } from '../repositories/reviewRepository.ts';
import { UserRepository } from '../repositories/userRepository.ts';

export class ReviewService {
  private reviewRepository: ReviewRepository;
  private stallRepository: StallRepository;
  private userRepository: UserRepository;

  constructor(
    reviewRepository: ReviewRepository = new ReviewRepository(),
    stallRepository: StallRepository = new StallRepository(),
    userRepository: UserRepository = new UserRepository(),
  ) {
    this.reviewRepository = reviewRepository;
    this.stallRepository = stallRepository;
    this.userRepository = userRepository;
  }

  async getAllReviews() {
    return this.reviewRepository.findAll();
  }

  async createReview(input: CreateReviewInput) {
    const [stall, user] = await Promise.all([
      this.stallRepository.findById(input.stallId),
      this.userRepository.findById(input.userId),
    ]);
    if (!stall) throw new Error('STALL_NOT_FOUND');
    if (!user) throw new Error('USER_NOT_FOUND');
    const review = await this.reviewRepository.create(input);
    if (!review) throw new Error('REVIEW_CREATE_FAILED');
    return review;
  }

  async deleteReview(id: number) {
    const review = await this.reviewRepository.remove(id);
    if (!review) throw new Error('REVIEW_NOT_FOUND');
    return review;
  }
}