import assert from 'node:assert/strict';
import test from 'node:test';
import { AuditService } from './auditService.ts';
import type { CreateAuditInput } from '../repositories/auditRepository.ts';
import { ReviewRepository } from '../repositories/reviewRepository.ts';
import { StallRepository, type CreateStallInput } from '../repositories/stallRepository.ts';
import { UserRepository } from '../repositories/userRepository.ts';
import { MenuItemRepository } from '../repositories/menuItemRepository.ts';
import type { DbExecutor } from '../db/transaction.ts';
import { withTransaction } from '../db/transaction.ts';
import { AppError } from '../errors/AppError.ts';
import type { AuthUser } from './tokenService.ts';
import { ReviewService } from './reviewService.ts';
import { StallService } from './stallService.ts';

type StallRow = NonNullable<Awaited<ReturnType<StallRepository['findById']>>>;
type ReviewRow = NonNullable<Awaited<ReturnType<ReviewRepository['findById']>>>;

const stall: StallRow = {
  id: 12,
  ownerId: 7,
  name: 'Warung Uji',
  category: 'Makanan',
  location: 'Kantin',
  description: null,
  avgRating: '4.50',
  reviewCount: 2,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
};

const review: ReviewRow = {
  id: 31,
  stallId: stall.id,
  userId: 9,
  rating: 5,
  comment: 'Komentar pribadi yang tidak boleh masuk metadata audit',
  likeCount: 0,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  user: { id: 9, name: 'Customer Uji' },
};

const owner: AuthUser = {
  id: 7,
  name: 'Owner Uji',
  email: 'owner@example.test',
  role: 'owner',
};
const admin: AuthUser = {
  id: 1,
  name: 'Admin Uji',
  email: 'admin@example.test',
  role: 'admin',
};
const tx = {} as DbExecutor;
const runInTransaction: typeof withTransaction = async (work) => work(tx);

class RecordingAuditService extends AuditService {
  records: Array<{ input: CreateAuditInput; executor: DbExecutor }> = [];

  override async recordMutation(input: CreateAuditInput, executor: DbExecutor): Promise<void> {
    this.records.push({ input, executor });
  }
}

class TestStallRepository extends StallRepository {
  executors: Array<DbExecutor | undefined> = [];

  override async findById(_id: number, executor?: DbExecutor) {
    this.executors.push(executor);
    return stall;
  }

  override async create(_input: CreateStallInput, executor?: DbExecutor) {
    this.executors.push(executor);
    return stall;
  }

  override async update(
    _id: number,
    _input: Partial<Omit<CreateStallInput, 'ownerId'>>,
    executor?: DbExecutor,
  ) {
    this.executors.push(executor);
    return stall;
  }

  override async remove(_id: number, executor?: DbExecutor) {
    this.executors.push(executor);
    return stall;
  }
}

class TestReviewRepository extends ReviewRepository {
  executors: Array<DbExecutor | undefined> = [];

  override async create(_input: Parameters<ReviewRepository['create']>[0], executor?: DbExecutor) {
    this.executors.push(executor);
    return review;
  }

  override async remove(_id: number, executor?: DbExecutor) {
    this.executors.push(executor);
    return review;
  }
}

class TestUserRepository extends UserRepository {
  executors: Array<DbExecutor | undefined> = [];

  override async findById(id: number, executor?: DbExecutor) {
    this.executors.push(executor);
    return { id, name: 'Customer Uji' };
  }
}

test('stall create, update, and delete are audited in their mutation transaction', async () => {
  const repository = new TestStallRepository();
  const audit = new RecordingAuditService();
  const service = new StallService(
    repository,
    new MenuItemRepository(),
    audit,
    runInTransaction,
  );

  await service.createStall({ name: 'Warung Baru' }, owner.id);
  await service.updateStall(stall.id, { name: 'Warung Diubah' }, owner);
  await service.deleteStall(stall.id, admin);

  assert.deepEqual(audit.records.map(({ input }) => [
    input.action, input.targetTable, input.targetId, input.userId,
  ]), [
    ['CREATE_STALL', 'STALLS', stall.id, owner.id],
    ['UPDATE_STALL', 'STALLS', stall.id, owner.id],
    ['DELETE_STALL', 'STALLS', stall.id, admin.id],
  ]);
  assert(audit.records.every(({ executor }) => executor === tx));
  assert(repository.executors.every((executor) => executor === tx));
});

test('owner cannot update another stall or create an audit entry', async () => {
  const repository = new TestStallRepository();
  const audit = new RecordingAuditService();
  const service = new StallService(
    repository,
    new MenuItemRepository(),
    audit,
    runInTransaction,
  );

  await assert.rejects(
    service.updateStall(stall.id, { name: 'Unauthorized change' }, { ...owner, id: 8 }),
    (error: unknown) => error instanceof AppError && error.statusCode === 403,
  );
  assert.equal(audit.records.length, 0);
  assert.deepEqual(repository.executors, [tx]);
});

test('review create and delete are audited in their mutation transaction without review text', async () => {
  const repository = new TestReviewRepository();
  const users = new TestUserRepository();
  const audit = new RecordingAuditService();
  const service = new ReviewService(
    repository,
    new TestStallRepository(),
    users,
    audit,
    runInTransaction,
  );

  await service.createReview({
    stallId: stall.id,
    userId: review.userId,
    rating: review.rating,
    comment: review.comment,
  });
  await service.deleteReview(review.id, admin);

  assert.deepEqual(audit.records.map(({ input }) => [
    input.action, input.targetTable, input.targetId, input.userId,
  ]), [
    ['CREATE_REVIEW', 'REVIEWS', review.id, review.userId],
    ['DELETE_REVIEW', 'REVIEWS', review.id, admin.id],
  ]);
  assert(audit.records.every(({ executor }) => executor === tx));
  assert(repository.executors.every((executor) => executor === tx));
  assert(users.executors.every((executor) => executor === tx));
  assert(!audit.records[0].input.metadata?.includes(review.comment ?? ''));
});
