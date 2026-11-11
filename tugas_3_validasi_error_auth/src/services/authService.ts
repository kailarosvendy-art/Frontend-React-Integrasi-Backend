import { AppError } from '../errors/AppError.ts';
import { UserRepository } from '../repositories/userRepository.ts';
import { hashPassword, verifyPassword } from './passwordService.ts';
import { signToken, type AuthUser } from './tokenService.ts';

interface RegisterInput {
  name: string;
  email: string;
  password: string;
}

interface LoginInput {
  email: string;
  password: string;
}

type AuthRepository = Pick<UserRepository, 'findByEmail' | 'create'>;
type AuthUserRow = NonNullable<Awaited<ReturnType<AuthRepository['findByEmail']>>>;

export class AuthService {
  constructor(private readonly userRepository: AuthRepository = new UserRepository()) {}

  private toUser(row: AuthUserRow): AuthUser {
    return { id: row.id, name: row.name, email: row.email, role: row.role };
  }

  async register(input: RegisterInput): Promise<AuthUser> {
    if (await this.userRepository.findByEmail(input.email)) {
      throw new AppError(409, 'Email sudah terdaftar');
    }

    try {
      const row = await this.userRepository.create({
        name: input.name,
        email: input.email,
        passwordHash: hashPassword(input.password),
      });
      if (!row) throw new AppError(500, 'Akun gagal dibuat');
      return this.toUser(row);
    } catch (error) {
      const dbError = error as { number?: number };
      if (dbError.number === 2601 || dbError.number === 2627) {
        throw new AppError(409, 'Email sudah terdaftar');
      }
      throw error;
    }
  }

  async login(input: LoginInput) {
    const row = await this.userRepository.findByEmail(input.email);
    if (!row || !verifyPassword(input.password, row.passwordHash)) {
      throw new AppError(401, 'Email atau password salah');
    }

    const user = this.toUser(row);
    return {
      token: signToken(user),
      tokenType: 'Bearer' as const,
      expiresIn: '2h',
      user,
    };
  }
}
