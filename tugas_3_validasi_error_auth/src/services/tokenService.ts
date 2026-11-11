import { createHmac, timingSafeEqual } from 'node:crypto';
import { AppError } from '../errors/AppError.ts';

export type UserRole = 'admin' | 'owner' | 'customer';

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: UserRole;
}

interface TokenPayload extends AuthUser {
  iat: number;
  exp: number;
}

const TOKEN_LIFETIME_SECONDS = 2 * 60 * 60;

function getSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret || Buffer.byteLength(secret) < 32) {
    throw new AppError(500, 'JWT_SECRET belum dikonfigurasi dengan aman');
  }
  return secret;
}

function sign(input: string): string {
  return createHmac('sha256', getSecret()).update(input).digest('base64url');
}

export function signToken(user: AuthUser): string {
  const now = Math.floor(Date.now() / 1000);
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({
    ...user,
    iat: now,
    exp: now + TOKEN_LIFETIME_SECONDS,
  } satisfies TokenPayload)).toString('base64url');
  const content = `${header}.${payload}`;
  return `${content}.${sign(content)}`;
}

export function verifyToken(token: string): AuthUser {
  const parts = token.split('.');
  if (parts.length !== 3) throw new AppError(401, 'Token tidak valid');

  const [headerPart, payloadPart, signature] = parts;
  const content = `${headerPart}.${payloadPart}`;
  const expected = Buffer.from(sign(content), 'base64url');
  const actual = Buffer.from(signature, 'base64url');
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) {
    throw new AppError(401, 'Token tidak valid');
  }

  let header: unknown;
  let payload: unknown;
  try {
    header = JSON.parse(Buffer.from(headerPart, 'base64url').toString('utf8'));
    payload = JSON.parse(Buffer.from(payloadPart, 'base64url').toString('utf8'));
  } catch {
    throw new AppError(401, 'Token tidak valid');
  }

  if (
    typeof header !== 'object' ||
    header === null ||
    !('alg' in header) ||
    header.alg !== 'HS256' ||
    typeof payload !== 'object' ||
    payload === null
  ) {
    throw new AppError(401, 'Token tidak valid');
  }

  const claims = payload as Partial<TokenPayload>;
  if (
    !Number.isInteger(claims.id) ||
    !claims.id ||
    typeof claims.name !== 'string' ||
    typeof claims.email !== 'string' ||
    !['admin', 'owner', 'customer'].includes(claims.role ?? '') ||
    typeof claims.exp !== 'number' ||
    claims.exp <= Math.floor(Date.now() / 1000)
  ) {
    throw new AppError(401, 'Token tidak valid atau sudah kedaluwarsa');
  }

  return {
    id: claims.id,
    name: claims.name,
    email: claims.email,
    role: claims.role as UserRole,
  };
}
