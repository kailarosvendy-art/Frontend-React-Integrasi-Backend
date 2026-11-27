import {
  StallRepository,
  type CreateStallInput,
  type FindAllParams,
} from '../repositories/stallRepository.ts';
import { MenuItemRepository } from '../repositories/menuItemRepository.ts';
import type { MenuItemDto, StallResponseDto } from '../dtos/stallDto.ts';
import { AppError } from '../errors/AppError.ts';
import { withTransaction } from '../db/transaction.ts';
import { AuditService } from './auditService.ts';
import type { AuthUser } from './tokenService.ts';

type StallRow = NonNullable<Awaited<ReturnType<StallRepository['findById']>>>;

export class StallService {
  private stallRepository: StallRepository;
  private menuItemRepository: MenuItemRepository;
  private auditService: AuditService;
  private runInTransaction: typeof withTransaction;

  constructor(
    stallRepository: StallRepository = new StallRepository(),
    menuItemRepository: MenuItemRepository = new MenuItemRepository(),
    auditService: AuditService = new AuditService(),
    runInTransaction: typeof withTransaction = withTransaction,
  ) {
    this.stallRepository = stallRepository;
    this.menuItemRepository = menuItemRepository;
    this.auditService = auditService;
    this.runInTransaction = runInTransaction;
  }

  // Mapping row DB -> DTO API (sekaligus logika bisnis isPopular).
  private toDto(row: StallRow): StallResponseDto {
    const avgRating = Number(row.avgRating);
    return {
      id: row.id,
      ownerId: row.ownerId,
      name: row.name,
      category: row.category,
      location: row.location,
      description: row.description,
      avgRating,
      reviewCount: row.reviewCount,
      isPopular: avgRating >= 4.7,
    };
  }

  async getAllStalls(params: FindAllParams) {
    const { rows, total } = await this.stallRepository.findAll(params);
    return { data: rows.map((row) => this.toDto(row)), total };
  }

  async getStallById(id: number): Promise<StallResponseDto> {
    const row = await this.stallRepository.findById(id);
    if (!row) throw new Error('STALL_NOT_FOUND');
    return this.toDto(row);
  }

  async getStallMenus(id: number): Promise<MenuItemDto[]> {
    const row = await this.stallRepository.findById(id);
    if (!row) throw new Error('STALL_NOT_FOUND');
    return this.menuItemRepository.findByStallId(id);
  }

  async createStall(
    input: Omit<CreateStallInput, 'ownerId'>,
    ownerId: number,
  ): Promise<StallResponseDto> {
    return this.runInTransaction(async (tx) => {
      const row = await this.stallRepository.create({ ...input, ownerId }, tx);
      if (!row) throw new Error('STALL_NOT_FOUND');
      await this.auditService.recordMutation({
        userId: ownerId,
        action: 'CREATE_STALL',
        targetTable: 'STALLS',
        targetId: row.id,
        metadata: JSON.stringify({ fields: Object.keys(input) }),
      }, tx);
      return this.toDto(row);
    });
  }

  async updateStall(
    id: number,
    input: Partial<Omit<CreateStallInput, 'ownerId'>>,
    user: AuthUser,
  ): Promise<StallResponseDto> {
    return this.runInTransaction(async (tx) => {
      const current = await this.stallRepository.findById(id, tx);
      if (!current) throw new AppError(404, 'Data warung tidak ditemukan');
      if (user.role !== 'admin' && current.ownerId !== user.id) {
        throw new AppError(403, 'Kamu hanya bisa mengubah warung milikmu sendiri');
      }

      const row = await this.stallRepository.update(id, input, tx);
      if (!row) throw new Error('STALL_NOT_FOUND');
      await this.auditService.recordMutation({
        userId: user.id,
        action: 'UPDATE_STALL',
        targetTable: 'STALLS',
        targetId: id,
        metadata: JSON.stringify({ changedFields: Object.keys(input) }),
      }, tx);
      return this.toDto(row);
    });
  }

  async deleteStall(id: number, user: AuthUser): Promise<StallResponseDto> {
    return this.runInTransaction(async (tx) => {
      const row = await this.stallRepository.remove(id, tx);
      if (!row) throw new Error('STALL_NOT_FOUND');
      await this.auditService.recordMutation({
        userId: user.id,
        action: 'DELETE_STALL',
        targetTable: 'STALLS',
        targetId: id,
        metadata: JSON.stringify({ changedFields: ['deleted'] }),
      }, tx);
      return this.toDto(row);
    });
  }
}
