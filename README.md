# Centralized API Management Platform

Phase 1 of our academic project: a Next.js dashboard, Fastify gateway, two Express sample services, and local PostgreSQL and Redis configuration.

## Current verification

- Passed: automated tests, dashboard build, both sample APIs, and the browser's Send request action returning HTTP 200.
- Pending: starting and verifying PostgreSQL and Redis. This machine currently has neither Docker Desktop nor WSL installed. Install and start Docker Desktop with its required Windows prerequisites, then run `npm run db:up` and refresh the dashboard. All five cards should show Online.

## Start the prototype

Install Node.js 22 or newer and Docker Desktop (free for education). Start Docker Desktop, then run these commands from this folder:

```sh
npm install
npm run db:up
npm run dev
```

Open http://localhost:3000. Click **Refresh status**, then **Send request**. The response should show HTTP 200 and a message from the API gateway. Health cards use real connection checks, not sample status values.

If Docker is unavailable, `npm run dev` still starts the dashboard, gateway and sample services. PostgreSQL and Redis will show Offline until you start them. Database setup is not complete until `npm run db:up` succeeds and both health cards show Online.

Stop the apps with Ctrl+C. Stop databases with `npm run db:down`; this keeps the PostgreSQL data volume.

## Local addresses

| Component | Address |
| --- | --- |
| Dashboard | http://localhost:3000 |
| Gateway health | http://127.0.0.1:4000/health |
| Combined health | http://127.0.0.1:4000/system/health |
| Sample users | http://127.0.0.1:4001/users |
| Sample products | http://127.0.0.1:4002/products |

The sample endpoints are available directly on loopback for Phase 1. Gateway routing arrives in Phase 2. In the final Compose setup, sample services will only be reachable inside the container network.

## Checks

```sh
npm test
npm run build
```

Tests cover a real gateway HTTP response, sample data and degraded health reporting. The build checks the dashboard. To finish the manual check, confirm all five health cards show Online with Docker running, and confirm **Send request** displays the gateway's timestamp and message.

## Project folders

- `apps/dashboard`: dashboard and its server-side gateway connection.
- `apps/gateway`: gateway health and dependency checks.
- `services`: users and products APIs using fake data.
- `compose.yaml`: local PostgreSQL and Redis.
- `plan.md`: phased development plan.

Configuration defaults work without an environment file. To customize them, copy `.env.example` to `.env` and edit it. If changing database credentials or database ports, update `compose.yaml` to match. Restart `npm run dev` after changes. Credentials in Compose are only for this local demo.

Service registration, key management, rate limits, persistent logs and admin login belong to later phases. No paid APIs, hosting or trial accounts are needed.
