import { createClient } from 'redis';
import { randomUUID } from 'node:crypto';

// The whole Redis check runs atomically, including concurrent requests.
const slidingWindow = `
local key = KEYS[1]
local now = tonumber(ARGV[1])
local window = tonumber(ARGV[2])
local limit = tonumber(ARGV[3])
redis.call('ZREMRANGEBYSCORE', key, '-inf', now - window)
local count = redis.call('ZCARD', key)
if count >= limit then
 local oldest = redis.call('ZRANGE', key, 0, 0, 'WITHSCORES')
 return {0, 0, math.max(1, math.ceil((tonumber(oldest[2]) + window - now) / 1000))}
end
redis.call('ZADD', key, now, ARGV[4])
redis.call('PEXPIRE', key, window)
return {1, limit - count - 1, 0}
`;
export function createMemoryLimiter() {
  const buckets = new Map();
  const cleanup = setInterval(() => {
    const now = Date.now();
    for (const [id, bucket] of buckets) if (bucket.expires <= now) buckets.delete(id);
  }, 60000);
  cleanup.unref();
  return {
    mode: 'memory',
    ping: async () => true,
    async consume(id, limit, windowSeconds, now = Date.now()) {
      const windowMs = windowSeconds * 1000;
      const times = (buckets.get(id)?.times || []).filter((time) => time > now - windowMs);
      const allowed = times.length < limit;
      if (allowed) times.push(now);
      buckets.set(id, { times, expires: now + windowMs });
      return {
        allowed,
        remaining: Math.max(0, limit - times.length),
        retryAfter: allowed ? 0 : Math.max(1, Math.ceil((times[0] + windowMs - now) / 1000)),
      };
    },
    async close() {
      clearInterval(cleanup);
      buckets.clear();
    },
  };
}
export async function createLimiter(config = {}) {
  const mode = config.mode || process.env.RATE_LIMIT_MODE || 'memory';
  if (mode === 'memory') return createMemoryLimiter();
  if (mode !== 'redis') throw new Error('RATE_LIMIT_MODE must be memory or redis');
  const client = createClient({
    url: config.url || process.env.REDIS_URL,
    disableOfflineQueue: true,
    socket: { connectTimeout: 2500, reconnectStrategy: (retries) => Math.min(100 * retries, 2000) },
  });
  client.on('error', () => {});
  const bounded = (promise) => {
    let timer;
    return Promise.race([
      promise,
      new Promise((_, reject) => {
        timer = setTimeout(() => reject(new Error('Redis unavailable')), 3000);
      }),
    ]).finally(() => clearTimeout(timer));
  };
  try {
    await bounded(client.connect());
  } catch (error) {
    if (client.isOpen) client.destroy();
    throw error;
  }
  return {
    mode,
    ping: () => bounded(client.ping()),
    async consume(id, limit, windowSeconds, now = Date.now()) {
      const [allowed, remaining, retryAfter] = await bounded(
        client.eval(slidingWindow, {
          keys: [`platform:rate:${id}`],
          arguments: [String(now), String(windowSeconds * 1000), String(limit), randomUUID()],
        }),
      );
      return { allowed: allowed === 1, remaining, retryAfter };
    },
    async close() {
      if (client.isOpen) client.destroy();
    },
  };
}
