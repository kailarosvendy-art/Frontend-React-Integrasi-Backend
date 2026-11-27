import 'dotenv/config';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { and, count, eq, sql } from 'drizzle-orm';
import { app } from '../src/app.ts';
import { closeDb, getDb } from '../src/db/index.ts';
import { auditLogs, menuItems, orderItems, orders, stalls, users } from '../src/db/schema.ts';
import { AuditService } from '../src/services/auditService.ts';
import { signToken } from '../src/services/tokenService.ts';

interface AuditItem { id: number; userId: number; targetId: number; action: string; targetTable: string; createdAt: string }
interface AuditList { items: AuditItem[]; pagination: { page: number; pageSize: number; total: number; totalPages: number } }
interface Envelope<T> { status: string; data: T; errors: Array<{ field: string; message: string }> }

async function main() {
  const database = process.env.DB_NAME ?? 'review_kantin';
  assert.equal(database, 'review_kantin', 'Gunakan database review_kantin yang sudah ada.');
  const output = path.resolve('../output/t5-evidence');
  await mkdir(output, { recursive: true });
  const results: Array<Record<string, unknown>> = [];
  const db = await getDb();
  const server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const address = server.address();
  assert(address && typeof address === 'object');
  const base = `http://127.0.0.1:${address.port}`;

  async function api<T = Record<string, never>>(name: string, method: string, url: string, expected: number, token?: string, body?: unknown) {
    const response = await fetch(base + url, {
      method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const payload = await response.json() as Envelope<T>;
    results.push({ name, method, url, expected, actual: response.status, passed: response.status === expected, response: payload });
    assert.equal(response.status, expected, name);
    console.log('PASS ' + name);
    return payload;
  }
  async function counts() {
    const totals: number[] = [];
    for (const table of [users, stalls, menuItems, orders, orderItems, auditLogs]) {
      const [row] = await db.select({ total: count() }).from(table);
      totals.push(Number(row.total));
    }
    return totals;
  }
  const originalWriter = AuditService.prototype.createAuditLog;
  const originalError = console.error;
  try {
    const existingUsers = await db.select({
      id: users.id, name: users.name, email: users.email, role: users.role,
    }).from(users).orderBy(users.id);
    const admin = existingUsers.find((user) => user.role === 'admin');
    const owner = existingUsers.find((user) => user.role === 'owner');
    const customer = existingUsers.find((user) => user.role === 'customer');
    assert(admin && owner && customer, 'Akun admin, owner, dan customer yang sudah ada diperlukan.');
    const adminToken = signToken(admin), ownerToken = signToken(owner), customerToken = signToken(customer);
    const before = await counts();

    await api('tanpa token', 'GET', '/api/audit-logs', 401);
    await api('owner ditolak', 'GET', '/api/audit-logs', 403, ownerToken);
    await api('customer ditolak', 'GET', '/api/audit-logs', 403, customerToken);
    const list = await api<AuditList>('daftar audit akun admin lama', 'GET', '/api/audit-logs', 200, adminToken);
    assert.equal(list.data.pagination.pageSize, 20);
    if (list.data.items.length) {
      const item = list.data.items[0];
      const detail = await api<AuditItem & { userName: string; userEmail: string }>(
        'detail audit', 'GET', '/api/audit-logs/' + item.id, 200, adminToken);
      assert.equal(detail.data.id, item.id);
      assert.equal(typeof detail.data.userName, 'string');
      assert.equal(typeof detail.data.userEmail, 'string');
      await api('detail tanpa token', 'GET', '/api/audit-logs/' + item.id, 401);
      await api('detail owner ditolak', 'GET', '/api/audit-logs/' + item.id, 403, ownerToken);
      await api('detail customer ditolak', 'GET', '/api/audit-logs/' + item.id, 403, customerToken);
      const filtered = await api<AuditList>('filter userId dan targetId AND', 'GET',
        `/api/audit-logs?userId=${item.userId}&targetId=${item.targetId}&pageSize=2`, 200, adminToken);
      assert(filtered.data.items.length > 0);
      assert(filtered.data.items.every((row) => row.userId === item.userId && row.targetId === item.targetId));
      const [matching] = await db.select({ total: count() }).from(auditLogs)
        .where(and(eq(auditLogs.userId, item.userId), eq(auditLogs.targetId, item.targetId)));
      assert.equal(filtered.data.pagination.total, Number(matching.total));
      assert.equal(filtered.data.pagination.totalPages, Math.ceil(Number(matching.total) / 2));
      const date = item.createdAt.slice(0, 10);
      const dates = await api<AuditList>('tanggal inklusif', 'GET',
        `/api/audit-logs?from=${date}&to=${date}`, 200, adminToken);
      assert(dates.data.items.length > 0);
      assert(dates.data.items.every((row) => row.createdAt.slice(0, 10) === date));
    }
    await api('detail tidak ada', 'GET', '/api/audit-logs/2147483647', 404, adminToken);
    for (const query of ['page=0', 'pageSize=101', 'targetId=-1', 'userId=1.5',
      'from=2026-02-30', 'from=2026-11-25&to=2026-11-24', 'unexpected=1']) {
      const result = await api('validasi ' + query, 'GET', '/api/audit-logs?' + query, 400, adminToken);
      assert(result.errors.every((issue) => typeof issue.field === 'string' && typeof issue.message === 'string'));
    }
    const first = await api<AuditList>('pagination halaman 1', 'GET', '/api/audit-logs?page=1&pageSize=2', 200, adminToken);
    const second = await api<AuditList>('pagination halaman 2', 'GET', '/api/audit-logs?page=2&pageSize=2', 200, adminToken);
    assert(first.data.items.length <= 2 && second.data.items.length <= 2);
    assert(!first.data.items.some((a) => second.data.items.some((b) => a.id === b.id)));
    const sorted = [...first.data.items, ...second.data.items];
    for (let i = 1; i < sorted.length; i++) {
      const previous = sorted[i - 1], current = sorted[i];
      assert(previous.createdAt > current.createdAt ||
        (previous.createdAt === current.createdAt && previous.id > current.id));
    }
    await api('alias audit v1', 'GET', '/api/v1/audit-logs', 200, adminToken);
    await api('menu tanpa token ditolak sebelum mutasi', 'POST', '/api/v1/menu-items', 401, undefined, {});
    await api('customer tidak boleh mengelola menu', 'POST', '/api/v1/menu-items', 403, customerToken, {});
    await api('owner tidak boleh checkout', 'POST', '/api/v1/orders', 403, ownerToken, {});
    await api('order tidak valid ditolak sebelum mutasi', 'POST', '/api/v1/orders', 400, customerToken, { total: 1 });
    await api('customer tidak boleh mengubah status', 'PATCH', '/api/v1/orders/2147483647/status', 403, customerToken, { status: 'completed' });
    await api('daftar pesanan admin', 'GET', '/api/v1/orders', 200, adminToken);

    const permissions = await db.execute(sql`SELECT
      HAS_PERMS_BY_NAME('dbo.AUDIT_LOGS','OBJECT','SELECT') AS s,
      HAS_PERMS_BY_NAME('dbo.AUDIT_LOGS','OBJECT','INSERT') AS i,
      HAS_PERMS_BY_NAME('dbo.AUDIT_LOGS','OBJECT','UPDATE') AS u,
      HAS_PERMS_BY_NAME('dbo.AUDIT_LOGS','OBJECT','DELETE') AS d`);
    assert.deepEqual(permissions.recordset[0], { s: 1, i: 1, u: 0, d: 0 });
    results.push({ name: 'izin audit SELECT/INSERT saja', passed: true, permissions: permissions.recordset[0] });

    // Simulasi di memori: tidak mengubah izin SQL dan tidak menambahkan audit.
    AuditService.prototype.createAuditLog = async () => { throw new Error('SIMULATED_AUDIT_FAILURE'); };
    console.error = () => {};
    await api('logout tetap 200 saat writer audit gagal (simulasi)', 'POST', '/api/v1/auth/logout', 200, customerToken);
    AuditService.prototype.createAuditLog = originalWriter;
    console.error = originalError;

    assert.deepEqual(await counts(), before);
    results.push({ name: 'jumlah akun dan data bisnis/audit tetap sama', passed: true });
    const proof = await db.execute(sql`SELECT TOP (20) id,user_id,action,target_table,target_id,metadata,created_at
      FROM dbo.AUDIT_LOGS ORDER BY created_at DESC,id DESC`);
    await writeFile(path.join(output, 'database-proof.json'), JSON.stringify({ database, rows: proof.recordset }, null, 2));
    console.log('Pemeriksaan review_kantin selesai tanpa penambahan data.');
  } finally {
    AuditService.prototype.createAuditLog = originalWriter;
    console.error = originalError;
    await writeFile(path.join(output, 'api-results.json'), JSON.stringify({
      database, mode: 'read-only; logout failure uses an in-memory simulation',
      checkedAt: new Date().toISOString(), results,
    }, null, 2));
    await new Promise<void>((resolve) => server.close(() => resolve()));
    await closeDb();
  }
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
