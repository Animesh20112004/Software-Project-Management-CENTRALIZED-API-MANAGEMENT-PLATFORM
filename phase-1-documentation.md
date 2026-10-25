# Phase 1: Implementation Guide

## 1. What this phase achieves

Phase 1 builds the foundation of our Centralized API Management Platform. We can open a dashboard, check which components are reachable, and send a real request to the API gateway.

The dashboard, gateway and two sample services were tested successfully. Database configuration is ready, but running PostgreSQL and Redis is still pending because Docker Desktop and WSL were unavailable during implementation.

## 2. What we built

| Component | Technology | Purpose in Phase 1 |
| --- | --- | --- |
| Dashboard | Next.js, React, Tailwind CSS and custom CSS | Shows service health and a gateway request demo. |
| API gateway | Node.js with Fastify | Answers health requests and checks other components. |
| Users service | Express.js | Returns a small list of fake users. |
| Products service | Express.js | Returns a small list of fake products. |
| PostgreSQL setup | Docker Compose, PostgreSQL 17 | Prepares the database for future settings and logs. |
| Redis setup | Docker Compose, Redis 8 | Prepares the store for future rate-limit counters. |
| Development tools | npm scripts and Node.js test runner | Start the apps together and check basic behaviour. |

All application code uses JavaScript. Everything is designed to run on our own computer without paid hosting or APIs.

## 3. How the parts work together

### Sending a request

When you click **Send request**, this happens:

1. The browser calls `/api/gateway/health` on the Next.js dashboard server.
2. That server forwards the request to the Fastify gateway at `http://127.0.0.1:4000/health`.
3. The gateway returns JSON containing its name, status, phase, a message and the current timestamp.
4. The dashboard displays that JSON, the HTTP status code and the total request time.

The Next.js server acts as a small bridge. The browser talks to its own server, so we do not need separate browser cross-origin configuration. The bridge only allows two actions: `health` and `system`.

The gateway's `/health` endpoint works independently of the databases. This lets us demonstrate a working request even before database setup is finished. The displayed request time includes the dashboard bridge and network round trip, not just gateway processing.

### Checking system health

The dashboard checks health when the page opens and when you click **Refresh status**. It does not continuously poll in the background.

The browser calls `/api/gateway/system`, which the bridge forwards to the gateway's `/system/health`. The gateway then checks these dependencies in parallel:

| Dependency | Check performed |
| --- | --- |
| Users and products services | Call each `/health` endpoint and check for a successful response with `status: "ok"`. |
| PostgreSQL | Open a connection and run `SELECT 1`, a tiny query that confirms the database can respond. |
| Redis | Connect and send `PING` to check that Redis responds. |

Each successful check becomes **Online**, with its elapsed time. A failed check becomes **Offline**. Checks use short timeouts so unavailable components do not leave the interface waiting indefinitely. Database connections are closed after checking.

If all dependencies respond, the gateway returns HTTP **200**. If any fail, it returns HTTP **503** with `status: "degraded"` and the individual results. The dashboard still displays those results. If the gateway itself cannot be reached, the bridge returns HTTP **502** and the dashboard shows an error instead of inventing health values.

### Sample services and data

Both sample services use the same helper in `services/sample-app.mjs`. Each service supplies its name and a small array of sample records. The helper creates a health endpoint and a data endpoint.

- Users: `http://127.0.0.1:4001/users`
- Products: `http://127.0.0.1:4002/products`

These records are hardcoded in JavaScript, not stored in PostgreSQL. For now, the data endpoints are called directly. The gateway only checks service health; forwarding normal user and product requests is Phase 2 work.

## 4. How the project starts

`npm run dev` runs `scripts/dev.mjs`, which starts four separate processes: the dashboard, gateway, users service and products service. It shares the correct local addresses through environment variables. If one process exits unexpectedly, the launcher stops the others. Ctrl+C stops the group.

The apps use ports **3000, 4000, 4001 and 4002**. They listen on `127.0.0.1`, meaning they are available locally on this computer.

Databases start separately with `npm run db:up`. Compose defines database health checks and keeps PostgreSQL data in a named volume, so a normal `npm run db:down` preserves it. Redis has no persistent volume in this phase. There are no application database tables or saved platform settings yet.

Default settings work without an `.env` file. For custom ports or connection addresses, copy `.env.example` to `.env`, edit it and restart the apps. Database changes must also match `compose.yaml`.

## 5. Important files

| File or folder | What to look for |
| --- | --- |
| `apps/dashboard/app/page.js` | Dashboard layout, button actions, loading states and response display. |
| `apps/dashboard/app/globals.css` | Colours, spacing and layouts for different screen sizes. |
| `apps/dashboard/app/api/gateway/[action]/route.js` | The server-side bridge to the gateway and its error handling. |
| `apps/gateway/app.mjs` | Gateway endpoints and combined health response. |
| `apps/gateway/health.mjs` | Actual service, PostgreSQL and Redis checks. |
| `services/` | Shared Express helper and fake users/products data. |
| `scripts/dev.mjs` | Starts and stops the application processes together. |
| `compose.yaml` | Local database containers, ports and health checks. |
| `tests/platform.test.mjs` | Automated checks for the Phase 1 backend behaviour. |

## 6. Running and checking the prototype

From the project folder, with Node.js installed:

```sh
npm install
npm run dev
```

Open `http://localhost:3000` and click **Send request**. You should see HTTP **200**, the gateway message and a fresh timestamp.

Once Docker Desktop and its Windows prerequisites are installed and running, use another terminal:

```sh
npm run db:up
```

Click **Refresh status**. All five components should show Online. Until the databases start, **3/5 online** is expected when the gateway and sample services are running.

Verification commands:

```sh
npm test
npm run build
```

During implementation, both automated tests and the dashboard build passed. Tests checked a real gateway HTTP response, its timestamp, an unknown route, sample data and correct reporting when dependencies are unavailable. Manual checks confirmed both sample APIs and the browser's request button worked. Successful database startup and the all-online state remain unverified.

## 7. What comes next

First, finish the local database setup and confirm that all five health cards show Online.

**Phase 2 adds service registration and routing:**

1. Create a PostgreSQL table for service names, route prefixes and backend addresses.
2. Add backend endpoints and a dashboard form to register and list services.
3. Make the gateway match an incoming route to a registered service and forward GET and POST requests.
4. Return useful errors for unknown routes and unavailable services.

The next demo will let us register the users and products services, then access them through one gateway address.

Later phases add admin login and API keys, Redis rate limiting, saved request logs, audit history and traffic summaries. Phase 1 has no access control or persistent monitoring yet; the roadmap in the dashboard is a guide to upcoming work.
