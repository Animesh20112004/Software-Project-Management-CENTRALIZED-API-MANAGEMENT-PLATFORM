/**
 * Production Process Coordinator for Render Deployment
 * Starts Next.js (production build), API Gateway, and sample microservices.
 */

import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

// Auto-load .env and .env.local if present in environment
if (typeof process.loadEnvFile === 'function') {
  try {
    process.loadEnvFile('.env');
  } catch {}
  try {
    process.loadEnvFile('.env.local');
  } catch {}
}

import { validateEnvironment } from '../apps/gateway/config.mjs';

// Validate environment variables before spawning any process
validateEnvironment();

const root = fileURLToPath(new URL('../', import.meta.url));
const dashboardDir = fileURLToPath(new URL('../apps/dashboard/', import.meta.url));
const nextBin = fileURLToPath(new URL('../node_modules/next/dist/bin/next', import.meta.url));

const publicPort = String(process.env.PORT || process.env.DASHBOARD_PORT || '3000');
const gatewayPort = String(process.env.GATEWAY_PORT || '4000');
const usersPort = String(process.env.USERS_PORT || '4001');
const productsPort = String(process.env.PRODUCTS_PORT || '4002');
const enableSampleServices = process.env.ENABLE_SAMPLE_SERVICES !== 'false';

const sharedEnv = {
  ...process.env,
  NODE_ENV: 'production',
  NEXT_TELEMETRY_DISABLED: '1',
  GATEWAY_URL: process.env.GATEWAY_URL || `http://127.0.0.1:${gatewayPort}`,
  USERS_URL: process.env.USERS_URL || `http://127.0.0.1:${usersPort}`,
  PRODUCTS_URL: process.env.PRODUCTS_URL || `http://127.0.0.1:${productsPort}`,
  HOST: process.env.HOST || '0.0.0.0',
  DASHBOARD_ORIGINS:
    process.env.DASHBOARD_ORIGINS ||
    `http://localhost:${publicPort},http://127.0.0.1:${publicPort},http://localhost:3000,http://127.0.0.1:3000`,
};

const children = [];
let shuttingDown = false;

function shutdown(exitCode = 0) {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`\nInitiating graceful shutdown (code: ${exitCode})...`);

  for (const { name, process: child } of children) {
    if (child && !child.killed) {
      console.log(`Stopping ${name}...`);
      try {
        child.kill('SIGTERM');
      } catch {
        // Child already terminated
      }
    }
  }

  // Force kill if graceful shutdown takes longer than 5 seconds
  const forceKillTimeout = setTimeout(() => {
    for (const { name, process: child } of children) {
      if (child && !child.killed) {
        console.warn(`Force killing ${name}...`);
        try {
          child.kill('SIGKILL');
        } catch {
          // Process already dead
        }
      }
    }
    process.exit(exitCode);
  }, 5000);

  forceKillTimeout.unref();
}

function startProcess(name, args, cwd = root, customEnv = {}) {
  console.log(`[Init] Starting ${name}...`);
  const child = spawn(process.execPath, args, {
    cwd,
    env: { ...sharedEnv, ...customEnv },
    stdio: 'inherit',
  });

  const entry = { name, process: child };
  children.push(entry);

  child.on('error', (err) => {
    console.error(`[Error] Failed to start ${name}: ${err.message}`);
    shutdown(1);
  });

  child.on('exit', (code, signal) => {
    if (!shuttingDown) {
      console.error(`[Exit] ${name} terminated unexpectedly with code ${code} / signal ${signal}`);
      shutdown(code || 1);
    }
  });

  return child;
}

// 1. Start Sample Microservices (if enabled)
if (enableSampleServices) {
  startProcess('Users Microservice', ['services/users/server.mjs'], root, {
    HOST: '127.0.0.1',
    USERS_PORT: usersPort,
  });
  startProcess('Products Microservice', ['services/products/server.mjs'], root, {
    HOST: '127.0.0.1',
    PRODUCTS_PORT: productsPort,
  });
}

// 2. Start Centralized API Gateway (internal port)
startProcess('API Gateway', ['apps/gateway/server.mjs'], root, {
  HOST: '127.0.0.1',
  PORT: gatewayPort,
  GATEWAY_PORT: gatewayPort,
});

// 3. Start Next.js Production Dashboard
startProcess(
  'Dashboard (Next.js)',
  [nextBin, 'start', '--hostname', '0.0.0.0', '--port', publicPort],
  dashboardDir,
  {
    PORT: publicPort,
  },
);

console.log(`Production server running. Public port: ${publicPort}`);

// Register shutdown listeners
process.on('SIGTERM', () => shutdown(0));
process.on('SIGINT', () => shutdown(0));
