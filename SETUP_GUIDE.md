# Production Setup & Deployment Guide

This guide provides step-by-step instructions to configure, deploy, and verify the **Centralized API Management Platform** on **Render** using a free managed **Neon PostgreSQL** database.

---

## 1. Database Setup Guide (Neon PostgreSQL)

The platform requires a PostgreSQL database in production. [Neon](https://neon.tech) offers a free serverless PostgreSQL tier with instant provisioning and native SSL support.

### Step 1: Create a Neon Account & Project

1. Navigate to [https://neon.tech](https://neon.tech) and sign up (or sign in with GitHub).
2. Click **Create Project**.
3. Set your project details:
   - **Project Name:** `api-platform` (or your preferred name)
   - **Postgres Version:** `17` (or default recommended)
   - **Region:** Choose the region closest to your Render service (e.g., `US East (Ohio)` or `Oregon` to match Render).
4. Click **Create Project**.

### Step 2: Obtain Connection String

1. In the Neon Console dashboard, locate the **Connection Details** card.
2. Select **Connection string** and ensure **Pooled connection** is unchecked or checked (both are supported).
3. The connection string format looks like:
   ```text
   postgresql://alex:AbCdEf123456@ep-cool-snowflake-123456.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```
4. Copy this URI. It will be provided to Render as `DATABASE_URL`.

> [!NOTE]
> The platform automatically detects Neon connection strings and configures TLS/SSL pooling parameters (`ssl: { rejectUnauthorized: false }`) with cold-start connection timeouts. No manual SSL certificate files are required.

---

## 2. Environment Variables Checklist

All platform behavior is configuration-driven. Set these variables in the Render Dashboard (**Environment** tab) or your local `.env` file.

| Variable                       | Required in Production            | Default / Fallback                    | Purpose & Example                                                                                                                        |
| ------------------------------ | --------------------------------- | ------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `NODE_ENV`                     | **Yes**                           | `development`                         | Set to `production` to activate production security, HTTPS cookies, and strict validation.                                               |
| `PORT`                         | **Automatic (Render)**            | `3000`                                | Public web port assigned dynamically by Render. The application binds to this port.                                                      |
| `HOST`                         | No                                | `0.0.0.0` in prod, `127.0.0.1` in dev | Network interface to bind to. `0.0.0.0` is required in cloud containers.                                                                 |
| `DATABASE_URL`                 | **Yes** (when `DB_MODE=postgres`) | None                                  | PostgreSQL connection string. Format: `postgresql://user:pass@ep-host.neon.tech/dbname?sslmode=require`                                  |
| `DB_MODE`                      | **Yes**                           | `postgres` in prod, `embedded` in dev | Database engine. Set to `postgres` on Render. Set to `embedded` for zero-install local dev.                                              |
| `ADMIN_USER`                   | No                                | `admin`                               | Administrator username for dashboard sign-in.                                                                                            |
| `ADMIN_PASSWORD`               | **Yes**                           | None (in prod)                        | Administrator password. In production, default passwords (`local-demo-123`) are strictly blocked. Example: `K9#mQ2$vL8!pZ5@wR4`          |
| `RATE_LIMIT_MODE`              | No                                | `memory`                              | Rate limiter storage. `memory` uses sliding-window in-memory map (free, 0 dependencies). Set to `redis` if external Redis is configured. |
| `REDIS_URL`                    | Optional                          | None                                  | Redis connection URI if `RATE_LIMIT_MODE=redis`. Example: `redis://default:token@redis-host:6379`                                        |
| `COOKIE_SECURE`                | No                                | `true` (in prod)                      | Enforces `Secure` flag on admin session cookies over HTTPS.                                                                              |
| `COOKIE_SAMESITE`              | No                                | `Strict`                              | Cookie SameSite policy (`Strict` or `Lax`).                                                                                              |
| `ENABLE_SAMPLE_SERVICES`       | No                                | `true`                                | Starts sample mock microservices (`/users` and `/products`) on internal loopback ports.                                                  |
| `SEED_DEMO_DATA`               | No                                | `true`                                | Seeds initial `/users` and `/products` routing entries if the database is newly initialized.                                             |
| `GATEWAY_PORT`                 | No                                | `4000`                                | Internal port for the Fastify gateway process.                                                                                           |
| `USERS_PORT`                   | No                                | `4001`                                | Internal port for the sample Users microservice.                                                                                         |
| `PRODUCTS_PORT`                | No                                | `4002`                                | Internal port for the sample Products microservice.                                                                                      |
| `DATABASE_SSL`                 | No                                | `true` (for cloud DB)                 | Controls SSL enforcement for PostgreSQL connections.                                                                                     |
| `DATABASE_REJECT_UNAUTHORIZED` | No                                | `false`                               | Accepts provider TLS certs without requiring custom CA bundle installation.                                                              |
| `DASHBOARD_ORIGINS`            | No                                | Auto-detected                         | Comma-separated allowed origins for CORS. Render external URL is automatically included.                                                 |

---

## 3. Render Deployment Instructions

You can deploy the platform to Render using either **Blueprint Deployment (One-Click)** or **Manual Web Service Creation**.

### Method A: Blueprint Deployment via `render.yaml` (Recommended)

1. Push your repository to GitHub or GitLab.
2. Log in to the [Render Dashboard](https://dashboard.render.com).
3. Click **New +** and select **Blueprint**.
4. Connect your GitHub repository.
5. Render detects `render.yaml` and displays the proposed service configuration:
   - **Service Name:** `centralized-api-platform`
   - **Runtime:** `Node`
   - **Plan:** `Free`
   - **Build Command:** `npm ci && npm run build`
   - **Start Command:** `npm start`
   - **Health Check Path:** `/health`
6. Under **Environment Variables**, provide your `DATABASE_URL` obtained from Neon.
7. Click **Apply**. Render will provision the build, execute migrations, and deploy the application.

---

### Method B: Manual Web Service Setup

If you prefer to configure the Web Service manually:

1. In Render Dashboard, click **New +** -> **Web Service**.
2. Select your repository.
3. Configure the settings:
   - **Name:** `centralized-api-platform`
   - **Region:** `Oregon` (or match your Neon DB region)
   - **Branch:** `main`
   - **Root Directory:** Leave blank (root `.`)
   - **Runtime:** `Node`
   - **Build Command:** `npm ci && npm run build`
   - **Start Command:** `npm start`
   - **Plan Type:** `Free`
4. Expand **Advanced**:
   - **Health Check Path:** `/health`
   - **Auto-Deploy:** `Yes`
5. Click **Add Environment Variable** and populate the variables from the checklist:
   ```text
   NODE_ENV = production
   DB_MODE = postgres
   DATABASE_URL = <Your Neon PostgreSQL Connection String>
   ADMIN_USER = admin
   ADMIN_PASSWORD = <Your Secure Random Password>
   RATE_LIMIT_MODE = memory
   COOKIE_SECURE = true
   SEED_DEMO_DATA = true
   ENABLE_SAMPLE_SERVICES = true
   ```
6. Click **Create Web Service**.

---

## 4. Local Development Setup

To run and test the project on your local machine:

### Mode 1: Zero-Dependency Local Dev (PGlite Embedded)

No Docker or PostgreSQL installation is required.

```bash
# 1. Install dependencies
npm ci

# 2. Copy sample configuration
cp .env.example .env

# 3. Start development stack
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

- **Username:** `admin`
- **Password:** `local-demo-123` (or the password configured in `.env`)

### Mode 2: Local Production Simulation

To verify how the application behaves in a compiled production environment before pushing to Render:

```bash
# 1. Compile Next.js dashboard
npm run build

# 2. Start coordinated production stack
npm start
```

### Mode 3: Automated Test Execution

```bash
# Run isolated regression test suite
npm test

# Run end-to-end integration health check against a running stack
npm run demo:check
```

---

## 5. Post-Deployment Verification Checklist

Once your Render deployment reaches **Live** status:

1. **Verify Health Endpoint:**

   ```bash
   curl -i https://<your-render-subdomain>.onrender.com/health
   ```

   _Expected:_ HTTP 200 OK with `{"status":"ok","service":"centralized-api-platform",...}`.

2. **Access Control Plane Dashboard:**
   - Open `https://<your-render-subdomain>.onrender.com` in your web browser.
   - Sign in using `ADMIN_USER` and `ADMIN_PASSWORD`.
   - Verify that the **Overview** displays the database status as online.

3. **Issue an API Key:**
   - Navigate to the **API keys** tab.
   - Click **Create API Key**.
   - Set a client name (e.g. `Production Test Client`), Limit `5`, Window `60` seconds.
   - Copy the generated API key (format: `cap_...`).

4. **Verify Gateway Proxy Route:**

   ```bash
   curl -i -H "X-API-Key: <YOUR_API_KEY>" https://<your-render-subdomain>.onrender.com/proxy/users
   ```

   _Expected:_ HTTP 200 OK with JSON array of users and rate-limiting response headers:
   - `x-ratelimit-limit: 5`
   - `x-ratelimit-remaining: 4`

5. **Verify Rate Limiting:**
   Send 6 rapid requests. The 6th request must receive:
   _Expected:_ HTTP 429 Too Many Requests with a `retry-after` header.

6. **Verify Telemetry & Audit Logs:**
   - Refresh the dashboard and navigate to **Request logs** to verify that both 200 OK and 429 Too Many Requests calls are recorded.
   - Navigate to **Audit trail** to confirm key creation events are logged.

---

## 6. Troubleshooting Common Deployment Issues

| Symptom                                              | Probable Cause                                      | Resolution                                                                                                                                                                |
| ---------------------------------------------------- | --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Render build fails on `npm run build`**            | Outdated or missing `node_modules`                  | Ensure Build Command is set to `npm ci && npm run build`.                                                                                                                 |
| **Render deployment blocked on startup**             | Insecure default password or missing `DATABASE_URL` | Check Render logs. The centralized environment validator halts startup if `ADMIN_PASSWORD` is `'local-demo-123'` or if `DATABASE_URL` is omitted when `DB_MODE=postgres`. |
| **Database connection error: SSL handshake failure** | Provider requires SSL                               | Ensure your `DATABASE_URL` ends with `?sslmode=require` and `DATABASE_SSL=true` is set.                                                                                   |
| **Database connection timeout during cold start**    | Serverless Neon compute waking from idle            | The platform pool is pre-configured with a 10-second connection timeout (`DATABASE_CONNECT_TIMEOUT_MS=10000`). If experiencing delays, increase this value to `15000`.    |
| **Admin login returns 403 Forbidden**                | CORS origin mismatch on browser request             | Ensure `RENDER_EXTERNAL_URL` or `FRONTEND_URL` is set, or add your custom domain to `DASHBOARD_ORIGINS`.                                                                  |
| **Sample services show offline in System Health**    | Sample services disabled                            | Ensure `ENABLE_SAMPLE_SERVICES=true` is set in environment variables.                                                                                                     |
