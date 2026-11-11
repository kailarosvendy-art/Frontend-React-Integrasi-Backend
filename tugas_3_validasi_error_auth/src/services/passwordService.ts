import { scryptSync, timingSafeEqual } from 'node:crypto';
import bcrypt from 'bcryptjs';

export function hashPassword(password: string): string {
  return bcrypt.hashSync(password, 10);
}

export function verifyPassword(password: string, storedHash: string): boolean {
  if (/^\$2[aby]\$/.test(storedHash)) {
    return bcrypt.compareSync(password, storedHash);
  }

  const [algorithm, salt, hash] = storedHash.split('$');
  if (
    algorithm !== 'scrypt' ||
    !salt ||
    !hash ||
    !/^[0-9a-f]{128}$/i.test(hash)
  ) {
    return false;
  }

  const expected = Buffer.from(hash, 'hex');
  const actual = scryptSync(password, salt, expected.length);
  return timingSafeEqual(expected, actual);
}
