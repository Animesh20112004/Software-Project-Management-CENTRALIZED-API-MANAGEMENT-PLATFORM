import Fastify, { LogController } from 'fastify';
import { randomUUID } from 'node:crypto';
import { checkDependencies } from './health.mjs';
import { createStore } from './store.mjs';
import { createLimiter, createMemoryLimiter } from './limiter.mjs';
import { hash, secret, passwordVerifier, sessionToken, cookie } from './security.mjs';

const text = (maxLength = 100) => ({ type: 'string', minLength: 1, maxLength });
const policy = {
  rate_limit: { type: 'integer', minimum: 1, maximum: 10000 },
  window_seconds: { type: 'integer', minimum: 1, maximum: 3600 },
};
const serviceFields = {
  name: text(80),
  prefix: { ...text(100), pattern: '^/[a-zA-Z0-9_-]+(?:/[a-zA-Z0-9_-]+)*$' },
  base_url: text(300),
  enabled: { type: 'boolean' },
};
const objectSchema = (properties, required = Object.keys(properties)) => ({
  type: 'object',
  additionalProperties: false,
  properties,
  required,
});
const publicKeyFields = 'id,name,hint,rate_limit,window_seconds,revoked,created_at';
const error = (reply, code, message) => reply.code(code).send({ error: message });

export async function buildGateway(options = {}) {
  const app = Fastify({
    logger: options.logger ?? false,
    logController: new LogController({ disableRequestLogging: true }),
    bodyLimit: 1048576,
  });
  const config = {
    usersUrl: process.env.USERS_URL || 'http://127.0.0.1:4001',
    productsUrl: process.env.PRODUCTS_URL || 'http://127.0.0.1:4002',
    adminUser: process.env.ADMIN_USER || 'admin',
    adminPassword: process.env.ADMIN_PASSWORD || 'local-demo-123',
    origins: (process.env.DASHBOARD_ORIGINS || 'http://localhost:3000,http://127.0.0.1:3000').split(','),
    upstreamTimeout: 5000,
    ...options.config,
  };
  const store = options.store || (await createStore());
  let limiter;
  try {
    limiter = options.limiter || (await createLimiter());
  } catch (err) {
    await store.close();
    throw err;
  }
  const loginLimiter = createMemoryLimiter();
  const verifyPassword = passwordVerifier(config.adminPassword);
  if (options.seed !== false) await store.seed(config.usersUrl, config.productsUrl);
  app.decorate('store', store);
  app.addHook('onClose', async () => {
    await loginLimiter.close();
    await limiter.close();
    await store.close();
  });
  app.addHook('onRequest', async (request, reply) => {
    reply.header('Cache-Control', 'no-store');
    request.startedAt = performance.now();
    if (request.url.startsWith('/admin/') && !['GET', 'HEAD'].includes(request.method)) {
      if (request.headers.origin && !config.origins.includes(request.headers.origin))
        return error(reply, 403, 'This origin is not allowed.');
    }
  });
  app.setErrorHandler((err, request, reply) => {
    if (err.validation)
      return error(reply, 400, 'Invalid input. Check the required fields and allowed values.');
    if (err.code === '23505') return error(reply, 409, 'That route prefix is already registered.');
    if (err.statusCode && err.statusCode < 500)
      return error(
        reply,
        err.statusCode,
        err.statusCode === 413 ? 'Request body is too large (maximum 1 MB).' : 'Invalid request.',
      );
    request.log.error({ code: err.code || 'INTERNAL' }, 'Request failed');
    return error(reply, 503, 'A required component is unavailable. Check system health.');
  });
  const audit = async (tx, action, id, details = {}) =>
    tx.query('INSERT INTO audit_logs(actor,action,entity_id,details) VALUES ($1,$2,$3,$4)', [
      config.adminUser,
      action,
      id,
      JSON.stringify(details),
    ]);
  const requireAdmin = async (request, reply) => {
    const token = sessionToken(request);
    if (!token || token.length > 100) return error(reply, 401, 'Please sign in.');
    const session = await store.query(
      'SELECT token_hash FROM sessions WHERE token_hash=$1 AND expires_at>$2',
      [hash(token), Date.now()],
    );
    if (!session.rows.length) return error(reply, 401, 'Your session has expired. Please sign in.');
  };
  const admin = { preHandler: requireAdmin };

  app.get('/health', async () => ({
    status: 'ok',
    service: 'api-gateway',
    phase: 6,
    timestamp: new Date().toISOString(),
    message: 'API gateway is running.',
  }));
  app.get('/system/health', async (_request, reply) => {
    const dependencies = await checkDependencies(config, store, limiter);
    const healthy = dependencies.every((item) => item.status === 'online');
    reply.code(healthy ? 200 : 503);
    return {
      status: healthy ? 'ok' : 'degraded',
      checkedAt: new Date().toISOString(),
      modes: { database: store.mode, limiter: limiter.mode },
      components: [
        { id: 'gateway', name: 'API gateway', status: 'online', latencyMs: null },
        ...dependencies,
      ],
    };
  });
  app.post(
    '/admin/login',
    { schema: { body: objectSchema({ username: text(100), password: text(200) }) } },
    async (request, reply) => {
      const allowed = await loginLimiter.consume(request.ip, 10, 60);
      if (!allowed.allowed) {
        reply.header('Retry-After', allowed.retryAfter);
        return error(reply, 429, 'Too many sign-in attempts. Try again in a minute.');
      }
      if (!verifyPassword(request.body.password) || request.body.username !== config.adminUser)
        return error(reply, 401, 'Incorrect username or password.');
      const token = secret();
      await store.transaction(async (tx) => {
        await tx.query('DELETE FROM sessions WHERE expires_at <= $1', [Date.now()]);
        if (sessionToken(request))
          await tx.query('DELETE FROM sessions WHERE token_hash=$1', [hash(sessionToken(request))]);
        await tx.query('INSERT INTO sessions(token_hash,expires_at) VALUES ($1,$2)', [
          hash(token),
          Date.now() + 8 * 3600000,
        ]);
        await audit(tx, 'admin.login', null);
      });
      reply.header('Set-Cookie', cookie(token));
      return { username: config.adminUser };
    },
  );
  app.get('/admin/me', admin, async () => ({ username: config.adminUser }));
  app.post('/admin/logout', admin, async (request, reply) => {
    await store.transaction(async (tx) => {
      await tx.query('DELETE FROM sessions WHERE token_hash=$1', [hash(sessionToken(request))]);
      await audit(tx, 'admin.logout', null);
    });
    reply.header('Set-Cookie', cookie('', 0));
    return { ok: true };
  });

  function validateService(body, reply) {
    let url;
    try {
      url = new URL(body.base_url);
    } catch {
      return error(reply, 400, 'Enter a valid backend URL.');
    }
    if (
      !['http:', 'https:'].includes(url.protocol) ||
      url.username ||
      url.password ||
      url.search ||
      url.hash ||
      url.pathname !== '/'
    ) {
      return error(reply, 400, 'Use an http(s) backend address without a path, query, or credentials.');
    }
    if (!body.name.trim()) return error(reply, 400, 'Service name cannot be blank.');
    body.name = body.name.trim();
    body.base_url = url.origin;
  }
  app.get('/admin/services', admin, async () => ({
    services: (await store.query('SELECT * FROM services ORDER BY created_at,id')).rows,
  }));
  app.post(
    '/admin/services',
    { ...admin, schema: { body: objectSchema(serviceFields, ['name', 'prefix', 'base_url']) } },
    async (request, reply) => {
      validateService(request.body, reply);
      if (reply.sent) return;
      const { name, prefix, base_url, enabled = true } = request.body;
      const id = randomUUID();
      const result = await store.transaction(async (tx) => {
        const row = await tx.query(
          'INSERT INTO services(id,name,prefix,base_url,enabled) VALUES ($1,$2,$3,$4,$5) RETURNING *',
          [id, name, prefix, base_url, enabled],
        );
        await audit(tx, 'service.created', id, { name, prefix, base_url, enabled });
        return row.rows[0];
      });
      return reply.code(201).send(result);
    },
  );
  app.put(
    '/admin/services/:id',
    { ...admin, schema: { body: objectSchema(serviceFields) } },
    async (request, reply) => {
      validateService(request.body, reply);
      if (reply.sent) return;
      const { name, prefix, base_url, enabled } = request.body;
      const result = await store.transaction(async (tx) => {
        const row = await tx.query(
          'UPDATE services SET name=$1,prefix=$2,base_url=$3,enabled=$4 WHERE id=$5 RETURNING *',
          [name, prefix, base_url, enabled, request.params.id],
        );
        if (row.rows.length)
          await audit(tx, 'service.updated', request.params.id, { name, prefix, base_url, enabled });
        return row.rows[0];
      });
      return result || error(reply, 404, 'Service not found.');
    },
  );
  app.delete('/admin/services/:id', admin, async (request, reply) => {
    const deleted = await store.transaction(async (tx) => {
      const row = await tx.query('DELETE FROM services WHERE id=$1 RETURNING name,prefix', [
        request.params.id,
      ]);
      if (row.rows.length) await audit(tx, 'service.deleted', request.params.id, row.rows[0]);
      return row.rows.length;
    });
    return deleted ? { ok: true } : error(reply, 404, 'Service not found.');
  });

  app.get('/admin/keys', admin, async () => ({
    keys: (await store.query(`SELECT ${publicKeyFields} FROM api_keys ORDER BY created_at DESC,id`)).rows,
  }));
  app.post(
    '/admin/keys',
    { ...admin, schema: { body: objectSchema({ name: text(80), ...policy }) } },
    async (request, reply) => {
      const name = request.body.name.trim();
      if (!name) return error(reply, 400, 'Client name cannot be blank.');
      const { rate_limit, window_seconds } = request.body;
      const id = randomUUID(),
        rawKey = `cap_${secret()}`,
        hint = rawKey.slice(-6);
      const result = await store.transaction(async (tx) => {
        const row = await tx.query(
          `INSERT INTO api_keys(id,name,key_hash,hint,rate_limit,window_seconds) VALUES ($1,$2,$3,$4,$5,$6) RETURNING ${publicKeyFields}`,
          [id, name, hash(rawKey), hint, rate_limit, window_seconds],
        );
        await audit(tx, 'key.created', id, { name, rate_limit, window_seconds });
        return row.rows[0];
      });
      return reply.code(201).send({ ...result, key: rawKey });
    },
  );
  app.patch(
    '/admin/keys/:id',
    { ...admin, schema: { body: objectSchema(policy) } },
    async (request, reply) => {
      const { rate_limit, window_seconds } = request.body;
      const result = await store.transaction(async (tx) => {
        const row = await tx.query(
          `UPDATE api_keys SET rate_limit=$1,window_seconds=$2 WHERE id=$3 AND revoked=false RETURNING ${publicKeyFields}`,
          [rate_limit, window_seconds, request.params.id],
        );
        if (row.rows.length)
          await audit(tx, 'key.policy_updated', request.params.id, { rate_limit, window_seconds });
        return row.rows[0];
      });
      return result || error(reply, 404, 'Active key not found.');
    },
  );
  app.post('/admin/keys/:id/revoke', admin, async (request, reply) => {
    const result = await store.transaction(async (tx) => {
      const row = await tx.query(
        `UPDATE api_keys SET revoked=true WHERE id=$1 AND revoked=false RETURNING ${publicKeyFields}`,
        [request.params.id],
      );
      if (row.rows.length) await audit(tx, 'key.revoked', request.params.id, { name: row.rows[0].name });
      return row.rows[0];
    });
    return result || error(reply, 404, 'Active key not found.');
  });

  app.get(
    '/admin/logs',
    {
      ...admin,
      schema: {
        querystring: objectSchema(
          {
            status: { type: 'integer', minimum: 100, maximum: 599 },
            client: text(),
            service: text(),
            path: text(100),
            limit: { type: 'integer', minimum: 1, maximum: 100 },
            offset: { type: 'integer', minimum: 0, maximum: 1000000 },
          },
          [],
        ),
      },
    },
    async (request) => {
      const { status, client, service, path, limit = 20, offset = 0 } = request.query;
      const params = [],
        clauses = [];
      for (const [column, value] of [
        ['status', status],
        ['client_id', client],
        ['service_id', service],
      ]) {
        if (value !== undefined) {
          params.push(value);
          clauses.push(`${column}=$${params.length}`);
        }
      }
      if (path) {
        params.push(`%${path}%`);
        clauses.push(`path ILIKE $${params.length}`);
      }
      const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
      const total = (await store.query(`SELECT count(*)::int AS total FROM request_logs ${where}`, params))
        .rows[0].total;
      const rows = await store.query(
        `SELECT * FROM request_logs ${where} ORDER BY id DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
        [...params, limit, offset],
      );
      return { logs: rows.rows, total, limit, offset };
    },
  );
  app.get(
    '/admin/audit',
    {
      ...admin,
      schema: {
        querystring: objectSchema({ offset: { type: 'integer', minimum: 0, maximum: 1000000 } }, []),
      },
    },
    async (request) => {
      const offset = request.query.offset || 0;
      return {
        logs: (await store.query('SELECT * FROM audit_logs ORDER BY id DESC LIMIT 20 OFFSET $1', [offset]))
          .rows,
        total: (await store.query('SELECT count(*)::int AS total FROM audit_logs')).rows[0].total,
        offset,
        limit: 20,
      };
    },
  );
  app.get('/admin/analytics', admin, async () => {
    const summary = (
      await store.query(`SELECT count(*)::int AS total,
      count(*) FILTER (WHERE status < 400)::int AS successful,
      count(*) FILTER (WHERE status IN (401,429))::int AS blocked,
      count(*) FILTER (WHERE status >= 400)::int AS failed,
      coalesce(round(avg(duration_ms)),0)::int AS average_ms FROM request_logs`)
    ).rows[0];
    const services = (
      await store.query(`SELECT coalesce(service_name,'Unmatched') AS name, count(*)::int AS requests,
      count(*) FILTER (WHERE status>=400)::int AS errors FROM request_logs GROUP BY service_name ORDER BY requests DESC LIMIT 20`)
    ).rows;
    return { ...summary, services, period: 'All recorded requests' };
  });

  app.addHook('onSend', async (request, reply, payload) => {
    if (!(request.url === '/proxy' || request.url.startsWith('/proxy/') || request.url.startsWith('/proxy?')))
      return payload;
    const logPath = request.url.split('?')[0].slice(0, 512);
    try {
      await store.query(
        'INSERT INTO request_logs(client_id,client_name,service_id,service_name,method,path,status,duration_ms) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)',
        [
          request.client?.id || null,
          request.client?.name || null,
          request.service?.id || null,
          request.service?.name || null,
          request.method,
          logPath,
          reply.statusCode,
          Math.round(performance.now() - request.startedAt),
        ],
      );
    } catch {
      request.log.error('Could not save request log');
    }
    return payload;
  });
  async function proxy(request, reply) {
    const rawKey = request.headers['x-api-key'];
    if (typeof rawKey !== 'string' || rawKey.length > 200 || !rawKey.startsWith('cap_'))
      return error(reply, 401, 'A valid X-API-Key header is required.');
    const key = (
      await store.query(
        'SELECT id,name,rate_limit,window_seconds,revoked FROM api_keys WHERE key_hash=$1',
        [hash(rawKey)],
      )
    ).rows[0];
    if (!key) return error(reply, 401, 'API key is invalid or revoked.');
    request.client = key;
    if (key.revoked) return error(reply, 401, 'API key is invalid or revoked.');
    const allowance = await limiter.consume(
      `${key.id}:${key.rate_limit}:${key.window_seconds}`,
      key.rate_limit,
      key.window_seconds,
    );
    reply.header('X-RateLimit-Limit', key.rate_limit).header('X-RateLimit-Remaining', allowance.remaining);
    if (!allowance.allowed) {
      reply.header('Retry-After', allowance.retryAfter);
      return error(reply, 429, 'Rate limit reached. Wait and try again.');
    }
    const targetPath = request.url.slice('/proxy'.length) || '/';
    const pathname = targetPath.split('?')[0];
    let decoded;
    try {
      decoded = decodeURIComponent(pathname);
    } catch {
      return error(reply, 400, 'Invalid path encoding.');
    }
    if (
      decoded.includes('\\') ||
      /%2f|%5c|%2e/i.test(pathname) ||
      decoded.split('/').some((part) => part === '.' || part === '..')
    )
      return error(reply, 400, 'Invalid path.');
    const services = (
      await store.query('SELECT * FROM services WHERE enabled=true ORDER BY length(prefix) DESC')
    ).rows;
    const service = services.find(
      (item) => pathname === item.prefix || pathname.startsWith(`${item.prefix}/`),
    );
    if (!service) return error(reply, 404, 'No enabled service matches this route.');
    request.service = service;
    try {
      const headers = { accept: request.headers.accept || 'application/json' };
      if (request.body !== undefined) headers['content-type'] = 'application/json';
      const upstream = await fetch(`${service.base_url}${targetPath}`, {
        method: request.method,
        headers,
        body:
          ['GET', 'HEAD'].includes(request.method) || request.body === undefined
            ? undefined
            : JSON.stringify(request.body),
        redirect: 'manual',
        signal: AbortSignal.timeout(config.upstreamTimeout),
      });
      if (upstream.status >= 300 && upstream.status < 400)
        return error(reply, 502, 'Backend redirects are not supported.');
      const chunks = [];
      let bytes = 0;
      for await (const chunk of upstream.body || []) {
        bytes += chunk.length;
        if (bytes > 2 * 1024 * 1024) throw new Error('Response too large');
        chunks.push(chunk);
      }
      const contentType = upstream.headers.get('content-type') || '';
      reply.type(contentType.includes('application/json') ? 'application/json' : 'text/plain; charset=utf-8');
      reply.header('X-Content-Type-Options', 'nosniff');
      return reply.code(upstream.status).send(Buffer.concat(chunks));
    } catch (err) {
      return error(
        reply,
        err.name === 'TimeoutError' || err.name === 'AbortError' ? 504 : 502,
        'Backend service is unavailable or did not respond in time.',
      );
    }
  }
  for (const url of ['/proxy', '/proxy/*'])
    app.route({ method: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD'], url, handler: proxy });
  return app;
}
