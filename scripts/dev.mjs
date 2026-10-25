import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const dashboard = fileURLToPath(new URL('../apps/dashboard/', import.meta.url));
const gatewayPort = process.env.GATEWAY_PORT || '4000';
const usersPort = process.env.USERS_PORT || '4001';
const productsPort = process.env.PRODUCTS_PORT || '4002';
const env = {
  ...process.env,
  GATEWAY_URL: `http://127.0.0.1:${gatewayPort}`,
  USERS_URL: `http://127.0.0.1:${usersPort}`,
  PRODUCTS_URL: `http://127.0.0.1:${productsPort}`,
  NEXT_TELEMETRY_DISABLED: '1',
};
const children = [];
let stopping = false;
function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  for (const child of children) child.kill();
  process.exitCode = code;
}
function start(name, args, cwd = root) {
  const child = spawn(process.execPath, args, { cwd, env, stdio: 'inherit' });
  children.push(child);
  child.on('error', (error) => { console.error(`${name}: ${error.message}`); stop(1); });
  child.on('exit', (code) => {
    if (!stopping) { console.error(`${name} stopped (${code}). Shutting down the demo.`); stop(code || 1); }
  });
}
start('Users service', ['services/users/server.mjs']);
start('Products service', ['services/products/server.mjs']);
start('Gateway', ['apps/gateway/server.mjs']);
start('Dashboard', [fileURLToPath(new URL('../node_modules/next/dist/bin/next', import.meta.url)), 'dev', '--webpack', '--hostname', '127.0.0.1', '--port', process.env.DASHBOARD_PORT || '3000'], dashboard);
process.on('SIGINT', () => stop());
process.on('SIGTERM', () => stop());
