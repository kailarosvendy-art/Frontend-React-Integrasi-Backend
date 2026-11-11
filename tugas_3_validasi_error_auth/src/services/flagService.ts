import { FlagRepository, type FlagStatus } from '../repositories/flagRepository.ts';

export class FlagService {
  private flagRepository: FlagRepository;

  constructor(flagRepository: FlagRepository = new FlagRepository()) {
    this.flagRepository = flagRepository;
  }

  async getAllFlags() {
    return this.flagRepository.findAll();
  }

  async updateFlagStatus(id: number, status: FlagStatus) {
    const flag = await this.flagRepository.updateStatus(id, status);
    if (!flag) throw new Error('FLAG_NOT_FOUND');
    return flag;
  }
}