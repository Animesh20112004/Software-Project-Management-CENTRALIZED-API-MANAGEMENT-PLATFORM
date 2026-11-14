/**
 * Centralized Configuration and Environment Validation Module
 * Validates required production settings at startup and provides sanitized config values.
 */

export function validateEnvironment() {
  const isProduction = process.env.NODE_ENV === 'production';
  const errors = [];

  const port = process.env.PORT || process.env.GATEWAY_PORT;
  if (port && (isNaN(Number(port)) || Number(port) <= 0 || Number(port) > 65535)) {
    errors.push(
      `Invalid PORT configuration: "${port}". Must be a valid TCP port number between 1 and 65535.`,
    );
  }

  const dbMode = process.env.DB_MODE || (isProduction ? 'postgres' : 'embedded');
  if (!['postgres', 'embedded'].includes(dbMode)) {
    errors.push(`Invalid DB_MODE: "${dbMode}". Must be either "postgres" or "embedded".`);
  }

  if (dbMode === 'postgres') {
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
      errors.push('DATABASE_URL is required when DB_MODE is set to "postgres".');
    } else if (!dbUrl.startsWith('postgres://') && !dbUrl.startsWith('postgresql://')) {
      errors.push(
        'DATABASE_URL must be a valid PostgreSQL connection URI starting with "postgresql://" or "postgres://".',
      );
    }
  }

  const rateLimitMode = process.env.RATE_LIMIT_MODE || 'memory';
  if (!['memory', 'redis'].includes(rateLimitMode)) {
    errors.push(`Invalid RATE_LIMIT_MODE: "${rateLimitMode}". Must be either "memory" or "redis".`);
  }

  if (rateLimitMode === 'redis') {
    const redisUrl = process.env.REDIS_URL;
    if (!redisUrl) {
      errors.push('REDIS_URL is required when RATE_LIMIT_MODE is set to "redis".');
    } else if (!redisUrl.startsWith('redis://') && !redisUrl.startsWith('rediss://')) {
      errors.push('REDIS_URL must be a valid Redis connection URI starting with "redis://" or "rediss://".');
    }
  }

  if (isProduction) {
    const adminPassword = process.env.ADMIN_PASSWORD;
    if (!adminPassword || adminPassword.trim() === '') {
      errors.push('ADMIN_PASSWORD is required in production.');
    } else if (adminPassword === 'local-demo-123') {
      errors.push(
        'Insecure default ADMIN_PASSWORD ("local-demo-123") is not allowed in production. Please set a secure password.',
      );
    }
  }

  if (errors.length > 0) {
    const message = [
      '=========================================================',
      'CRITICAL CONFIGURATION ERROR: STARTUP BLOCKED',
      'The application cannot start due to missing or invalid environment variables:',
      ...errors.map((err, i) => `  ${i + 1}. ${err}`),
      '=========================================================',
    ].join('\n');
    console.error(message);
    throw new Error(`Startup validation failed:\n${errors.join('\n')}`);
  }
}

export function getGatewayConfig(overrides = {}) {
  const isProduction = process.env.NODE_ENV === 'production';
  const defaultHost = isProduction ? '0.0.0.0' : process.env.HOST || '127.0.0.1';

  // Compute allowed origins including Render-injected URLs and custom frontend URLs
  const defaultOrigins = ['http://localhost:3000', 'http://127.0.0.1:3000'];
  if (process.env.RENDER_EXTERNAL_URL) {
    defaultOrigins.push(process.env.RENDER_EXTERNAL_URL.replace(/\/$/, ''));
  }
  if (process.env.FRONTEND_URL) {
    defaultOrigins.push(process.env.FRONTEND_URL.replace(/\/$/, ''));
  }
  if (process.env.DASHBOARD_ORIGINS) {
    for (const origin of process.env.DASHBOARD_ORIGINS.split(',')) {
      const trimmed = origin.trim().replace(/\/$/, '');
      if (trimmed && !defaultOrigins.includes(trimmed)) {
        defaultOrigins.push(trimmed);
      }
    }
  }

  return {
    isProduction,
    host: process.env.HOST || defaultHost,
    port: Number(process.env.PORT || process.env.GATEWAY_PORT || 4000),
    usersUrl: process.env.USERS_URL || 'http://127.0.0.1:4001',
    productsUrl: process.env.PRODUCTS_URL || 'http://127.0.0.1:4002',
    adminUser: process.env.ADMIN_USER || 'admin',
    adminPassword: process.env.ADMIN_PASSWORD || 'local-demo-123',
    origins: defaultOrigins,
    upstreamTimeout: Number(process.env.UPSTREAM_TIMEOUT_MS || 5000),
    dbMode: process.env.DB_MODE || (isProduction ? 'postgres' : 'embedded'),
    databaseUrl: process.env.DATABASE_URL,
    rateLimitMode: process.env.RATE_LIMIT_MODE || 'memory',
    redisUrl: process.env.REDIS_URL,
    seedDemoData: process.env.SEED_DEMO_DATA !== 'false',
    ...overrides,
  };
}
