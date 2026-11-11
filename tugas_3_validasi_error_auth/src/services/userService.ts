import type { UserResponseDto } from '../dtos/userDto.ts';
import { UserRepository } from '../repositories/userRepository.ts';
import { hashPassword } from './passwordService.ts';

export interface CreateUserInput {
  name: string;
  email: string;
  password: string;
}

type UserRow = NonNullable<Awaited<ReturnType<UserRepository['create']>>>;

export class UserService {
  private userRepository: UserRepository;

  constructor(userRepository: UserRepository = new UserRepository()) {
    this.userRepository = userRepository;
  }

  async getAllUsers(): Promise<UserResponseDto[]> {
    return this.userRepository.findAll();
  }

  private toDto(row: UserRow): UserResponseDto {
    return {
      id: row.id,
      name: row.name,
      email: row.email,
      role: row.role,
      createdAt: row.createdAt,
    };
  }

  async createUser(input: CreateUserInput): Promise<UserResponseDto> {
    const row = await this.userRepository.create({
      name: input.name,
      email: input.email,
      passwordHash: hashPassword(input.password),
    });
    if (!row) throw new Error('USER_CREATE_FAILED');
    return this.toDto(row);
  }
}