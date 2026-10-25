import Fastify from 'fastify';
import { checkDependencies } from './health.mjs';

export function buildGateway(options = {}) {
  const app = Fastify({ logger: options.logger ?? false });
  const config = {
    usersUrl: process.env.USERS_URL || 'http://127.0.0.1:4001',
    productsUrl: process.env.PRODUCTS_URL || 'http://127.0.0.1:4002',
    databaseUrl: process.env.DATABASE_URL || 'postgresql://platform:platform_local@127.0.0.1:5432/platform',
    redisUrl: process.env.REDIS_URL || 'redis://127.0.0.1:6379',
    ...options.config,
  };
  app.get('/health', async () => ({
    status: 'ok', service: 'api-gateway', phase: 1,
    message: 'Hello from the API gateway. Phase 1 is running.',
    timestamp: new Date().toISOString(),
  }));
  app.get('/system/health', async (_request, reply) => {
    const dependencies = await checkDependencies(config);
    const healthy = dependencies.every((item) => item.status === 'online');
    reply.code(healthy ? 200 : 503);
    return {
      status: healthy ? 'ok' : 'degraded',
      checkedAt: new Date().toISOString(),
      components: [{ id: 'gateway', name: 'API gateway', status: 'online', latencyMs: null }, ...dependencies],
    };
  });
  return app;
}
