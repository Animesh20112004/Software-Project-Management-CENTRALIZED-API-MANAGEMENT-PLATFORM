import pg from 'pg';
import { PGlite } from '@electric-sql/pglite';
import { randomUUID } from 'node:crypto';
import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';

const schema = `
CREATE TABLE IF NOT EXISTS services (
 id TEXT PRIMARY KEY, name TEXT NOT NULL, prefix TEXT UNIQUE NOT NULL,
 base_url TEXT NOT NULL, enabled BOOLEAN NOT NULL DEFAULT true, created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS api_keys (
 id TEXT PRIMARY KEY, name TEXT NOT NULL, key_hash TEXT UNIQUE NOT NULL, hint TEXT NOT NULL,
 rate_limit INTEGER NOT NULL CHECK (rate_limit BETWEEN 1 AND 10000),
 window_seconds INTEGER NOT NULL CHECK (window_seconds BETWEEN 1 AND 3600),
 revoked BOOLEAN NOT NULL DEFAULT false, created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS sessions (token_hash TEXT PRIMARY KEY, expires_at BIGINT NOT NULL);
CREATE TABLE IF NOT EXISTS request_logs (
 id BIGSERIAL PRIMARY KEY, created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 client_id TEXT, client_name TEXT, service_id TEXT, service_name TEXT,
 method TEXT NOT NULL, path TEXT NOT NULL, status INTEGER NOT NULL, duration_ms INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS audit_logs (
 id BIGSERIAL PRIMARY KEY, created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 actor TEXT NOT NULL, action TEXT NOT NULL, entity_id TEXT, details JSONB NOT NULL DEFAULT '{}'
);
CREATE INDEX IF NOT EXISTS request_logs_created_idx ON request_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS request_logs_client_idx ON request_logs(client_id);
CREATE TABLE IF NOT EXISTS app_meta (name TEXT PRIMARY KEY);
`;
export async function createStore(config = {}) {
  const mode = config.mode || process.env.DB_MODE || 'embedded';
  let db;
  if (mode === 'postgres') {
    const pool = new pg.Pool({
      connectionString: config.url || process.env.DATABASE_URL,
      connectionTimeoutMillis: 3000,
      statement_timeout: 5000,
      max: 8,
    });
    pool.on('error', () => {});
    db = {
      query: (sql, values) => pool.query(sql, values),
      close: () => pool.end(),
      transaction: async (fn) => {
        const client = await pool.connect();
        try {
          await client.query('BEGIN');
          const value = await fn(client);
          await client.query('COMMIT');
          return value;
        } catch (error) {
          await client.query('ROLLBACK');
          throw error;
        } finally {
          client.release();
        }
      },
    };
    await db.query(schema);
  } else if (mode === 'embedded') {
    const dataDir = config.memory
      ? undefined
      : resolve(config.dataDir || process.env.DATA_DIR || 'data/platform');
    if (dataDir) await mkdir(dataDir, { recursive: true });
    db = new PGlite(dataDir);
    await db.exec(schema);
  } else {
    throw new Error('DB_MODE must be embedded or postgres');
  }
  return {
    mode,
    query: (sql, values = []) => db.query(sql, values),
    transaction: (fn) => db.transaction(fn),
    close: () => db.close(),
    async seed(usersUrl, productsUrl) {
      await db.transaction(async (tx) => {
        const inserted = await tx.query(
          "INSERT INTO app_meta(name) VALUES ('seed-v1') ON CONFLICT DO NOTHING RETURNING name",
        );
        if (!inserted.rows.length) return;
        for (const [name, prefix, url] of [
          ['Users', '/users', usersUrl],
          ['Products', '/products', productsUrl],
        ]) {
          await tx.query('INSERT INTO services(id,name,prefix,base_url) VALUES ($1,$2,$3,$4)', [
            randomUUID(),
            name,
            prefix,
            url,
          ]);
        }
        await tx.query("INSERT INTO audit_logs(actor,action,details) VALUES ('system','demo.seeded',$1)", [
          JSON.stringify({ services: ['Users', 'Products'] }),
        ]);
      });
    },
  };
}
