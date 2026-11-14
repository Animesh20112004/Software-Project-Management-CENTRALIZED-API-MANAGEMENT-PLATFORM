import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const dashboard = fileURLToPath(new URL('../apps/dashboard/', import.meta.url));
const gatewayPort = process.env.GATEWAY_PORT || '4000';
const usersPort = process.env.USERS_PORT || '4001';
const productsPort = process.env.PRODUCTS_PORT || '4002';
const dashboardPort = process.env.DASHBOARD_PORT || '3000';

const env = {
  ...process.env,
  GATEWAY_URL: `http://127.0.0.1:${gatewayPort}`,
  USERS_URL: `http://127.0.0.1:${usersPort}`,
  PRODUCTS_URL: `http://127.0.0.1:${productsPort}`,
  NEXT_TELEMETRY_DISABLED: '1',
  DASHBOARD_ORIGINS:
    process.env.DASHBOARD_ORIGINS || `http://localhost:${dashboardPort},http://127.0.0.1:${dashboardPort}`,
};

const children = [];
let stopping = false;

function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  for (const child of children) child.kill();
  process.exitCode = code;
}

function start(name, args, cwd = root, customEnv = {}) {
  const child = spawn(process.execPath, args, {
    cwd,
    env: { ...env, ...customEnv },
    stdio: 'inherit',
  });
  children.push(child);
  child.on('error', (error) => {
    console.error(`${name}: ${error.message}`);
    stop(1);
  });
  child.on('exit', (code) => {
    if (!stopping) {
      console.error(`${name} stopped (${code}). Shutting down the demo.`);
      stop(code || 1);
    }
  });
}

start('Users service', ['services/users/server.mjs'], root, { USERS_PORT: usersPort, PORT: usersPort });
start('Products service', ['services/products/server.mjs'], root, {
  PRODUCTS_PORT: productsPort,
  PORT: productsPort,
});
start('Gateway', ['apps/gateway/server.mjs'], root, { GATEWAY_PORT: gatewayPort, PORT: gatewayPort });
start(
  'Dashboard',
  [
    fileURLToPath(new URL('../node_modules/next/dist/bin/next', import.meta.url)),
    'dev',
    '--webpack',
    '--hostname',
    '127.0.0.1',
    '--port',
    dashboardPort,
  ],
  dashboard,
  { PORT: dashboardPort },
);

process.on('SIGINT', () => stop());
process.on('SIGTERM', () => stop());
