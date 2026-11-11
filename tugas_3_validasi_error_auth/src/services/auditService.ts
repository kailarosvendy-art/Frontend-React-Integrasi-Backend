import { UserRepository } from '../repositories/userRepository.ts';
import { AuditRepository, type CreateAuditInput } from '../repositories/auditRepository.ts';

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

  async getAllAuditLogs() {
    return this.auditRepository.findAll();
  }

  async createAuditLog(input: CreateAuditInput) {
    const user = await this.userRepository.findById(input.userId);
    if (!user) throw new Error('USER_NOT_FOUND');
    const audit = await this.auditRepository.create(input);
    if (!audit) throw new Error('AUDIT_CREATE_FAILED');
    return audit;
  }
}