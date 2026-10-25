import pg from 'pg';
import { createClient } from 'redis';

async function measure(id, name, check) {
  const start = performance.now();
  try {
    await check();
    return { id, name, status: 'online', latencyMs: Math.round(performance.now() - start) };
  } catch {
    return { id, name, status: 'offline', latencyMs: null };
  }
}

export function checkDependencies(config) {
  const httpCheck = async (url) => {
    const response = await fetch(`${url}/health`, { signal: AbortSignal.timeout(1500) });
    if (!response.ok || (await response.json()).status !== 'ok') throw new Error('Unhealthy');
  };
  return Promise.all([
    measure('users', 'Users service', () => httpCheck(config.usersUrl)),
    measure('products', 'Products service', () => httpCheck(config.productsUrl)),
    measure('postgres', 'PostgreSQL', async () => {
      const client = new pg.Client({ connectionString: config.databaseUrl, connectionTimeoutMillis: 1500, query_timeout: 1500 });
      client.on('error', () => {});
      try { await client.connect(); await client.query('SELECT 1'); }
      finally { await client.end().catch(() => {}); }
    }),
    measure('redis', 'Redis', async () => {
      const client = createClient({ url: config.redisUrl, socket: { connectTimeout: 1500, reconnectStrategy: false } });
      client.on('error', () => {});
      try {
        await client.connect();
        await Promise.race([
          client.ping(),
          new Promise((_, reject) => { const timer = setTimeout(() => reject(new Error('Timeout')), 1500); timer.unref(); }),
        ]);
      } finally { if (client.isOpen) client.destroy(); }
    }),
  ]);
}
