import assert from 'node:assert/strict';

// Runs against the dashboard bridge by default, covering browser -> gateway -> service.
const base =
  process.env.DEMO_BASE_URL || `http://127.0.0.1:${process.env.DASHBOARD_PORT || 3000}/api/platform`;
let cookie = '',
  keyId;
async function request(path, { method = 'GET', body, key } = {}) {
  const response = await fetch(`${base}${path}`, {
    method,
    headers: {
      ...(cookie ? { cookie } : {}),
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(key ? { 'X-API-Key': key } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(15000),
  });
  const value = await response.json();
  return { response, value };
}
try {
  const login = await request('/admin/login', {
    method: 'POST',
    body: {
      username: process.env.ADMIN_USER || 'admin',
      password: process.env.ADMIN_PASSWORD || 'local-demo-123',
    },
  });
  assert.equal(login.response.status, 200, 'Admin sign-in failed');
  cookie = login.response.headers.get('set-cookie').split(';')[0];
  const created = await request('/admin/keys', {
    method: 'POST',
    body: { name: 'Automated demo check', rate_limit: 5, window_seconds: 2 },
  });
  assert.equal(created.response.status, 201);
  keyId = created.value.id;
  const key = created.value.key;
  const burst = await Promise.all(Array.from({ length: 10 }, () => request('/proxy/users', { key })));
  assert.equal(burst.filter((item) => item.response.status === 200).length, 5);
  assert.equal(burst.filter((item) => item.response.status === 429).length, 5);
  console.log('PASS: 10 concurrent calls -> 5 allowed and 5 rate limited.');
  await new Promise((resolve) => setTimeout(resolve, 2100));
  assert.equal((await request('/proxy/users', { key })).response.status, 200);
  assert.equal((await request('/proxy/users')).response.status, 401);
  assert.equal((await request('/proxy/unknown', { key })).response.status, 404);
  const logs = await request(`/admin/logs?client=${keyId}&status=429`);
  assert.equal(logs.value.total, 5);
  await request(`/admin/keys/${keyId}/revoke`, { method: 'POST' });
  keyId = null;
  assert.equal((await request('/proxy/users', { key })).response.status, 401);
  console.log('PASS: window recovery, missing/revoked keys, unknown route and persisted filtered logs.');
} finally {
  if (keyId) await request(`/admin/keys/${keyId}/revoke`, { method: 'POST' }).catch(() => {});
  if (cookie) await request('/admin/logout', { method: 'POST' }).catch(() => {});
}
