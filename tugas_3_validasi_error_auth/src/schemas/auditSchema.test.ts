import assert from 'node:assert/strict';
import test from 'node:test';
import { auditLogQuerySchema } from './auditSchema.ts';

test('audit query defaults and accepts exact filters', () => {
  assert.deepEqual(auditLogQuerySchema.parse({}), {
    page: 1,
    pageSize: 20,
  });
  assert.deepEqual(auditLogQuerySchema.parse({
    page: '2',
    pageSize: '50',
    action: 'LOGIN',
    targetTable: 'USERS',
    targetId: '4',
    userId: '3',
    from: '2026-02-28',
    to: '2026-03-01',
  }), {
    page: 2,
    pageSize: 50,
    action: 'LOGIN',
    targetTable: 'USERS',
    targetId: 4,
    userId: 3,
    from: '2026-02-28',
    to: '2026-03-01',
  });
});

test('audit query rejects invalid ranges, dates, pagination and unknown filters', () => {
  for (const query of [
    { page: '0' },
    { pageSize: '101' },
    { targetId: '-1' },
    { userId: '1.5' },
    { from: '0000-12-31' },
    { from: '2026-02-30' },
    { from: '2026-03-02', to: '2026-03-01' },
    { unexpected: 'value' },
  ]) {
    assert.equal(auditLogQuerySchema.safeParse(query).success, false);
  }
});
