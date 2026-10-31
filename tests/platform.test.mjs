import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import pg from 'pg';
import { randomUUID } from 'node:crypto';
import { buildGateway } from '../apps/gateway/app.mjs';
import { createStore } from '../apps/gateway/store.mjs';
import { createMemoryLimiter, createLimiter } from '../apps/gateway/limiter.mjs';
import { createSampleApp } from '../services/sample-app.mjs';

async function testStore(t) {
  if (!process.env.TEST_DATABASE_URL) return createStore({ memory: true, mode: 'embedded' });
  const schema = `test_${randomUUID().replaceAll('-', '')}`;
  const pool = new pg.Pool({ connectionString: process.env.TEST_DATABASE_URL });
  await pool.query(`CREATE SCHEMA ${schema}`);
  t.after(async () => {
    await pool.query(`DROP SCHEMA ${schema} CASCADE`);
    await pool.end();
  });
  const url = new URL(process.env.TEST_DATABASE_URL);
  url.searchParams.set('options', `-csearch_path=${schema}`);
  return createStore({ mode: 'postgres', url: url.toString() });
}

test('full platform integration', async (t) => {
  const store = await testStore(t);
  const users = createSampleApp('users', [{ id: 1, name: 'Asha', role: 'Student' }]).listen(0, '127.0.0.1');
  const products = createSampleApp('products', [{ id: 1, name: 'Notebook' }]).listen(0, '127.0.0.1');
  await Promise.all([once(users, 'listening'), once(products, 'listening')]);
  t.after(() => new Promise((resolve) => users.close(resolve)));
  t.after(() => new Promise((resolve) => products.close(resolve)));
  const usersUrl = `http://127.0.0.1:${users.address().port}`,
    productsUrl = `http://127.0.0.1:${products.address().port}`;
  const limiter = process.env.TEST_REDIS_URL
    ? await createLimiter({ mode: 'redis', url: process.env.TEST_REDIS_URL })
    : createMemoryLimiter();
  const app = await buildGateway({ store, limiter, config: { usersUrl, productsUrl, upstreamTimeout: 100 } });
  t.after(() => app.close());
  const address = await app.listen({ host: '127.0.0.1', port: 0 });
  let adminCookie, key, keyId, usersService;
  const call = (method, url, payload, headers = {}) =>
    app.inject({
      method,
      url,
      ...(payload !== undefined ? { payload } : {}),
      headers: { ...(adminCookie ? { cookie: adminCookie } : {}), ...headers },
    });
  const client = (url, payload, rawKey = key) =>
    call(payload === undefined ? 'GET' : 'POST', url, payload, rawKey ? { 'x-api-key': rawKey } : {});

  await t.test('live HTTP health and truthful mode reporting', async () => {
    const response = await fetch(`${address}/health`);
    assert.equal(response.status, 200);
    assert.equal((await response.json()).phase, 6);
    const health = await call('GET', '/system/health');
    assert.equal(health.statusCode, 200);
    assert.equal(health.json().components.filter((c) => c.status === 'online').length, 5);
    assert.equal(health.json().modes.database, store.mode);
  });
  await t.test('admin routes require login and reject foreign origins', async () => {
    assert.equal((await call('GET', '/admin/services')).statusCode, 401);
    assert.equal(
      (await call('POST', '/admin/login', { username: 'admin', password: 'wrong' })).statusCode,
      401,
    );
    assert.equal(
      (
        await call(
          'POST',
          '/admin/login',
          { username: 'admin', password: 'local-demo-123' },
          { origin: 'https://other.test' },
        )
      ).statusCode,
      403,
    );
    const login = await call('POST', '/admin/login', { username: 'admin', password: 'local-demo-123' });
    assert.equal(login.statusCode, 200);
    assert.match(login.headers['set-cookie'], /HttpOnly; SameSite=Strict/);
    adminCookie = login.headers['set-cookie'].split(';')[0];
    assert.equal((await call('GET', '/admin/me')).json().username, 'admin');
  });
  await t.test('seeded services, registration, input checks and duplicate routes', async () => {
    const list = (await call('GET', '/admin/services')).json().services;
    assert.equal(list.length, 2);
    usersService = list.find((s) => s.prefix === '/users');
    assert.equal(
      (await call('POST', '/admin/services', { name: 'Duplicate', prefix: '/users', base_url: usersUrl }))
        .statusCode,
      409,
    );
    assert.equal(
      (await call('POST', '/admin/services', { name: 'Bad', prefix: '/bad', base_url: 'file:///etc' }))
        .statusCode,
      400,
    );
    assert.equal(
      (await call('POST', '/admin/services', { name: 'Bad', prefix: '/bad', base_url: `${usersUrl}/users` }))
        .statusCode,
      400,
    );
    const created = await call('POST', '/admin/services', {
      name: 'Unavailable',
      prefix: '/unavailable',
      base_url: 'http://127.0.0.1:1',
    });
    assert.equal(created.statusCode, 201);
  });
  await t.test('issue key once, store only hash and validate limits', async () => {
    assert.equal(
      (await call('POST', '/admin/keys', { name: 'Invalid', rate_limit: 0, window_seconds: 10 })).statusCode,
      400,
    );
    const created = await call('POST', '/admin/keys', {
      name: 'Test client',
      rate_limit: 100,
      window_seconds: 1,
    });
    assert.equal(created.statusCode, 201);
    key = created.json().key;
    keyId = created.json().id;
    assert.match(key, /^cap_/);
    const list = (await call('GET', '/admin/keys')).body;
    assert.ok(!list.includes(key));
    assert.ok(!list.includes('key_hash'));
    const saved = (await store.query('SELECT * FROM api_keys WHERE id=$1', [keyId])).rows[0];
    assert.notEqual(saved.key_hash, key);
    assert.equal(saved.key_hash.length, 64);
  });
  await t.test('missing, invalid and malformed API keys are rejected', async () => {
    assert.equal((await client('/proxy/users', undefined, '')).statusCode, 401);
    assert.equal((await client('/proxy/users', undefined, 'cap_invalid')).statusCode, 401);
    assert.equal((await client('/proxy/users', undefined, 'wrong')).statusCode, 401);
  });
  await t.test('GET path and query forwarding; POST body and status forwarding', async () => {
    const list = await client('/proxy/users?q=Asha');
    assert.equal(list.statusCode, 200);
    assert.equal(list.json().data[0].name, 'Asha');
    const filtered = await client('/proxy/users?q=nobody');
    assert.equal(filtered.json().data.length, 0);
    const created = await client('/proxy/users', { name: 'New student', role: 'Student' });
    assert.equal(created.statusCode, 201);
    assert.equal(created.json().data.name, 'New student');
    const record = await client(`/proxy/users/${created.json().data.id}`);
    assert.equal(record.statusCode, 200);
    assert.equal((await client('/proxy/products')).json().data[0].name, 'Notebook');
    assert.equal((await client('/proxy/users', {})).statusCode, 400);
  });
  await t.test('unmatched, prefix boundary, disabled and unavailable routes', async () => {
    assert.equal((await client('/proxy/missing')).statusCode, 404);
    assert.equal((await client('/proxy/users-other')).statusCode, 404);
    assert.equal((await client('/proxy/unavailable')).statusCode, 502);
    const values = {
      name: usersService.name,
      prefix: usersService.prefix,
      base_url: usersService.base_url,
      enabled: false,
    };
    assert.equal((await call('PUT', `/admin/services/${usersService.id}`, values)).statusCode, 200);
    assert.equal((await client('/proxy/users')).statusCode, 404);
    await call('PUT', `/admin/services/${usersService.id}`, { ...values, enabled: true });
    assert.equal((await client('/proxy/users')).statusCode, 200);
    assert.equal((await client('/proxy/users%2f..%2fproducts')).statusCode, 400);
  });
  await t.test('longest matching route and deletion are reflected immediately', async () => {
    const specific = await call('POST', '/admin/services', {
      name: 'Specific',
      prefix: '/users/detail',
      base_url: 'http://127.0.0.1:1',
    });
    assert.equal((await client('/proxy/users/detail')).statusCode, 502);
    assert.equal((await call('DELETE', `/admin/services/${specific.json().id}`)).statusCode, 200);
    assert.equal((await client('/proxy/users/detail')).statusCode, 404);
  });
  await t.test('policy updates, exact concurrent limit and window recovery', async () => {
    assert.equal(
      (await call('PATCH', `/admin/keys/${keyId}`, { rate_limit: 5, window_seconds: 1 })).statusCode,
      200,
    );
    const replies = await Promise.all(Array.from({ length: 12 }, () => client('/proxy/users')));
    assert.equal(replies.filter((r) => r.statusCode === 200).length, 5);
    assert.equal(replies.filter((r) => r.statusCode === 429).length, 7);
    assert.equal(replies.find((r) => r.statusCode === 429).headers['retry-after'], '1');
    await new Promise((resolve) => setTimeout(resolve, 1100));
    assert.equal((await client('/proxy/users')).statusCode, 200);
  });
  await t.test('limits are per key and revoked keys stop working immediately', async () => {
    const another = await call('POST', '/admin/keys', {
      name: 'Separate',
      rate_limit: 1,
      window_seconds: 10,
    });
    assert.equal((await client('/proxy/users', undefined, another.json().key)).statusCode, 200);
    assert.equal((await client('/proxy/users', undefined, another.json().key)).statusCode, 429);
    assert.equal((await call('POST', `/admin/keys/${another.json().id}/revoke`)).statusCode, 200);
    assert.equal((await client('/proxy/users', undefined, another.json().key)).statusCode, 401);
    const revokedLog = (await call('GET', `/admin/logs?status=401&client=${another.json().id}`)).json();
    assert.equal(revokedLog.total, 1);
    assert.equal(revokedLog.logs[0].client_name, 'Separate');
  });
  await t.test('filtered logs, audit evidence and analytics without secrets', async () => {
    const denied = (await call('GET', '/admin/logs?status=401')).json();
    assert.ok(denied.total >= 4);
    assert.ok(denied.logs.every((log) => log.status === 401));
    const limited = (await call('GET', `/admin/logs?status=429&client=${keyId}&limit=2&offset=2`)).json();
    assert.equal(limited.total, 7);
    assert.equal(limited.logs.length, 2);
    const pathFilter = (await call('GET', '/admin/logs?path=products')).json();
    assert.ok(pathFilter.total > 0);
    const audit = (await call('GET', '/admin/audit')).json();
    assert.ok(audit.logs.some((log) => log.action === 'key.revoked'));
    assert.ok(audit.logs.some((log) => log.action === 'service.updated'));
    assert.ok(audit.logs.some((log) => log.action === 'key.policy_updated'));
    const all = JSON.stringify({
      denied,
      limited,
      audit,
      rows: (await store.query('SELECT * FROM request_logs')).rows,
    });
    assert.ok(!all.includes(key));
    assert.ok(!all.includes('local-demo-123'));
    assert.ok(!all.includes('?q='));
    const stats = (await call('GET', '/admin/analytics')).json();
    assert.equal(stats.total, stats.successful + stats.failed);
    assert.ok(stats.blocked >= 12);
  });
  await t.test('logout invalidates the session and expiration is enforced', async () => {
    assert.equal((await call('POST', '/admin/logout')).statusCode, 200);
    assert.equal((await call('GET', '/admin/me')).statusCode, 401);
    const login = await call('POST', '/admin/login', { username: 'admin', password: 'local-demo-123' });
    adminCookie = login.headers['set-cookie'].split(';')[0];
    await store.query('UPDATE sessions SET expires_at=0');
    assert.equal((await call('GET', '/admin/keys')).statusCode, 401);
  });
});

test('local sliding window boundary is exact', async () => {
  const limiter = createMemoryLimiter();
  try {
    assert.equal((await limiter.consume('a', 1, 1, 1000)).allowed, true);
    assert.equal((await limiter.consume('a', 1, 1, 1999)).allowed, false);
    assert.equal((await limiter.consume('a', 1, 1, 2000)).allowed, true);
    assert.equal((await limiter.consume('b', 1, 1, 2000)).allowed, true);
  } finally {
    await limiter.close();
  }
});

test('embedded settings and key revocation survive restart; seeds do not recreate deleted services', async () => {
  const folder = await mkdtemp(join(tmpdir(), 'api-platform-test-'));
  let store;
  try {
    store = await createStore({ mode: 'embedded', dataDir: folder });
    await store.seed('http://127.0.0.1:4001', 'http://127.0.0.1:4002');
    await store.query("UPDATE services SET enabled=false WHERE prefix='/users'");
    await store.query("DELETE FROM services WHERE prefix='/products'");
    await store.query(
      "INSERT INTO api_keys(id,name,key_hash,hint,rate_limit,window_seconds,revoked) VALUES ('persist','Persist','hash','hint',3,20,true)",
    );
    await store.query(
      "INSERT INTO request_logs(method,path,status,duration_ms) VALUES ('GET','/proxy/users',401,1)",
    );
    await store.close();
    store = null;
    store = await createStore({ mode: 'embedded', dataDir: folder });
    await store.seed('http://127.0.0.1:4001', 'http://127.0.0.1:4002');
    const services = (await store.query('SELECT * FROM services')).rows;
    assert.equal(services.length, 1);
    assert.equal(services[0].enabled, false);
    assert.equal((await store.query('SELECT * FROM api_keys')).rows[0].revoked, true);
    assert.equal((await store.query('SELECT * FROM request_logs')).rows.length, 1);
  } finally {
    if (store) await store.close();
    await rm(folder, { recursive: true, force: true });
  }
});
