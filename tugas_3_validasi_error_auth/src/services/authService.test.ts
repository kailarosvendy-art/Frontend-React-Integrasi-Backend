import assert from 'node:assert/strict';
import { randomBytes, scryptSync } from 'node:crypto';
import test from 'node:test';
import { AppError } from '../errors/AppError.ts';
import { AuthService } from './authService.ts';
import { verifyPassword } from './passwordService.ts';
import { signToken, verifyToken } from './tokenService.ts';

process.env.JWT_SECRET ??= randomBytes(48).toString('base64url');

test('register creates a customer account and login returns a verifiable JWT', async () => {
  const rows: Array<{
    id: number;
    name: string;
    email: string;
    role: 'customer';
    passwordHash: string;
    createdAt: null;
  }> = [];
  const service = new AuthService({
    findByEmail: async (email) => rows.find((row) => row.email === email),
    create: async (input) => {
      const row = { ...input, id: rows.length + 1, role: 'customer' as const, createdAt: null };
      rows.push(row);
      return row;
    },
  });

  const user = await service.register({
    name: 'Uji Customer',
    email: 'uji@example.com',
    password: 'rahasia123',
  });
  assert.equal(user.role, 'customer');
  assert.equal('passwordHash' in user, false);

  const result = await service.login({ email: user.email, password: 'rahasia123' });
  assert.equal(result.tokenType, 'Bearer');
  assert.deepEqual(verifyToken(result.token), user);
});

test('register rejects duplicate email and login rejects incorrect passwords', async () => {
  const rows: Array<{
    id: number;
    name: string;
    email: string;
    role: 'customer';
    passwordHash: string;
    createdAt: null;
  }> = [];
  const service = new AuthService({
    findByEmail: async (email) => rows.find((row) => row.email === email),
    create: async (input) => {
      const row = { ...input, id: rows.length + 1, role: 'customer' as const, createdAt: null };
      rows.push(row);
      return row;
    },
  });
  const input = { name: 'Uji Customer', email: 'uji@example.com', password: 'rahasia123' };
  await service.register(input);

  await assert.rejects(service.register(input), (error: unknown) => (
    error instanceof AppError && error.statusCode === 409
  ));
  await assert.rejects(
    service.login({ email: input.email, password: 'password-salah' }),
    (error: unknown) => error instanceof AppError && error.statusCode === 401,
  );
});

test('legacy scrypt passwords remain valid after bcrypt is introduced', () => {
  const salt = 'legacy-test-salt';
  const hash = `scrypt$${salt}$${scryptSync('rahasia123', salt, 64).toString('hex')}`;
  assert.equal(verifyPassword('rahasia123', hash), true);
  assert.equal(verifyPassword('password-salah', hash), false);
});

test('tampered JWT signatures are rejected', () => {
  const signed = {
    id: 1,
    name: 'Admin',
    email: 'admin@example.com',
    role: 'admin' as const,
  };
  const jwt = signToken(signed);
  const parts = jwt.split('.');
  parts[2] = `${parts[2].startsWith('a') ? 'b' : 'a'}${parts[2].slice(1)}`;
  assert.throws(() => verifyToken(parts.join('.')), (error: unknown) => (
    error instanceof AppError && error.statusCode === 401
  ));
});
