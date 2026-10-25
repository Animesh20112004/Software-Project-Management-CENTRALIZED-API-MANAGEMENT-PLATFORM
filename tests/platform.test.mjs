import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { buildGateway } from '../apps/gateway/app.mjs';
import { createSampleApp } from '../services/sample-app.mjs';

test('gateway responds to a real HTTP request without requiring databases', async (t) => {
  const gateway = buildGateway();
  t.after(() => gateway.close());
  const address = await gateway.listen({ port: 0, host: '127.0.0.1' });
  const response = await fetch(`${address}/health`);
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.service, 'api-gateway');
  assert.equal(body.phase, 1);
  assert.ok(!Number.isNaN(Date.parse(body.timestamp)));
  assert.equal((await fetch(`${address}/missing`)).status, 404);
});

test('sample data is accessible and system checks distinguish live and unavailable services', async (t) => {
  const users = createSampleApp('users', [{ id: 1, name: 'Demo' }]).listen(0, '127.0.0.1');
  await once(users, 'listening');
  t.after(() => new Promise((resolve) => users.close(resolve)));
  const usersUrl = `http://127.0.0.1:${users.address().port}`;
  assert.deepEqual((await (await fetch(`${usersUrl}/users`)).json()).data, [{ id: 1, name: 'Demo' }]);
  const gateway = buildGateway({ config: {
    usersUrl, productsUrl: 'http://127.0.0.1:1',
    databaseUrl: 'postgresql://demo:demo@127.0.0.1:1/demo', redisUrl: 'redis://127.0.0.1:1',
  } });
  t.after(() => gateway.close());
  const result = await gateway.inject({ url: '/system/health' });
  assert.equal(result.statusCode, 503);
  const status = Object.fromEntries(result.json().components.map((item) => [item.id, item.status]));
  assert.deepEqual(status, { gateway: 'online', users: 'online', products: 'offline', postgres: 'offline', redis: 'offline' });
});
