import { ReviewRepository } from '../repositories/reviewRepository.ts';
import { LikeRepository, type CreateLikeInput } from '../repositories/likeRepository.ts';
import { UserRepository } from '../repositories/userRepository.ts';

export class LikeService {
  private likeRepository: LikeRepository;
  private reviewRepository: ReviewRepository;
  private userRepository: UserRepository;

  constructor(
    likeRepository: LikeRepository = new LikeRepository(),
    reviewRepository: ReviewRepository = new ReviewRepository(),
    userRepository: UserRepository = new UserRepository(),
  ) {
    this.likeRepository = likeRepository;
    this.reviewRepository = reviewRepository;
    this.userRepository = userRepository;
  }

  async createLike(input: CreateLikeInput) {
    const [review, user] = await Promise.all([
      this.reviewRepository.findById(input.reviewId),
      this.userRepository.findById(input.userId),
    ]);
    if (!review) throw new Error('REVIEW_NOT_FOUND');
    if (!user) throw new Error('USER_NOT_FOUND');
    const like = await this.likeRepository.create(input);
    if (!like) throw new Error('LIKE_CREATE_FAILED');
    return like;
  }

  async deleteLike(id: number) {
    const like = await this.likeRepository.remove(id);
    if (!like) throw new Error('LIKE_NOT_FOUND');
    return like;
  }
}