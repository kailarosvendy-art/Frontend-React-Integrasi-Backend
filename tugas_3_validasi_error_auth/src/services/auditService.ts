import { UserRepository } from '../repositories/userRepository.ts';
import { AuditRepository, type CreateAuditInput } from '../repositories/auditRepository.ts';
import type { AuditLogQuery } from '../schemas/auditSchema.ts';
import type { DbExecutor } from '../db/transaction.ts';

export class AuditService {
  private auditRepository: AuditRepository;
  private userRepository: UserRepository;

  constructor(
    auditRepository: AuditRepository = new AuditRepository(),
    userRepository: UserRepository = new UserRepository(),
  ) {
    this.auditRepository = auditRepository;
    this.userRepository = userRepository;
  }

  private withParsedMetadata<T extends { metadata: string | null }>(audit: T) {
    if (audit.metadata === null) return { ...audit, metadata: null };
    try {
      return { ...audit, metadata: JSON.parse(audit.metadata) as unknown };
    } catch {
      return { ...audit, metadata: audit.metadata };
    }
  }

  async getAllAuditLogs(filters: AuditLogQuery) {
    const { items, total } = await this.auditRepository.findAll(filters);
    return {
      items: items.map((item) => this.withParsedMetadata(item)),
      pagination: {
        page: filters.page,
        pageSize: filters.pageSize,
        total,
        totalPages: Math.ceil(total / filters.pageSize),
      },
    };
  }

  async getAuditLogById(id: number) {
    const audit = await this.auditRepository.findById(id);
    return audit ? this.withParsedMetadata(audit) : undefined;
  }

  async createAuditLog(input: CreateAuditInput) {
    const user = await this.userRepository.findById(input.userId);
    if (!user) throw new Error('USER_NOT_FOUND');
    const audit = await this.auditRepository.create(input);
    if (!audit) throw new Error('AUDIT_CREATE_FAILED');
    return this.withParsedMetadata(audit);
  }

  // Audit mutasi wajib berhasil sebelum transaksi bisnis di-commit.
  async recordMutation(input: CreateAuditInput, tx: DbExecutor): Promise<void> {
    const audit = await this.auditRepository.create(input, tx);
    if (!audit) throw new Error('AUDIT_CREATE_FAILED');
  }
}
