# Complete project: how it works

For a detailed connected walkthrough, a complete file map, configuration and API references, and future improvements, see [PROJECT_GUIDE.md](PROJECT_GUIDE.md).

## What has been built

This is a local academic API management platform with one administrator, two sample services and a dashboard. It implements the six planned phases without paid services.

| Area               | Working features                                                                                            |
| ------------------ | ----------------------------------------------------------------------------------------------------------- |
| Dashboard          | Sign-in, overview, health checks, services, API keys, request playground, logs, audit trail and demo guide. |
| Service management | Register, edit, enable, disable and delete routes. Settings are saved.                                      |
| Gateway            | Match the longest registered prefix and forward a request to its backend.                                   |
| Access control     | Admin sessions and client API keys. Create and revoke keys. Only key hashes are stored.                     |
| Traffic limits     | A configurable sliding window for each client key, enforced before forwarding.                              |
| Monitoring         | Saved request logs, filters, pagination, traffic totals and configuration audit events.                     |
| Demo/testing       | Seeded services, integration tests, a full HTTP demo check, k6 load test and Docker setup.                  |

## Two ways to run

**Local demo:** `npm start` runs everything needed to demonstrate the features. PGlite provides an embedded PostgreSQL engine and saves its files under `data/platform`. A limiter inside the gateway process tracks recent requests. Its counters reset on restart. This mode was added because Docker/WSL is not installed on this machine.

**Docker:** `npm run docker:up` builds and starts the dashboard, gateway, sample services, PostgreSQL and Redis. PostgreSQL saves data in a named volume. Redis handles shared request counters with an atomic script. Sample services have no published host ports. This mode implements the presentation's deployment stack but still needs runtime verification on a Docker-equipped machine.

The dashboard labels the active mode. Switching modes does not migrate data: the embedded database and Docker PostgreSQL are separate stores.

## Request flow

1. A client calls a gateway address such as `/proxy/users` with an `X-API-Key` header.
2. The gateway hashes the supplied key and finds an active matching record. A missing, invalid or revoked key returns **401**.
3. The limiter removes timestamps outside the client's window and counts the remaining calls. If the limit is reached, the gateway returns **429** and a `Retry-After` header.
4. The gateway finds an enabled service whose prefix matches the request path. The longest match wins. `/users` matches `/users/1`, but not `/users-other`. No match returns **404**.
5. It removes only `/proxy`, preserves the remaining path and query, and forwards the method and JSON body. For example, `/proxy/users?q=Asha` becomes `/users?q=Asha` at the registered backend origin.
6. The backend status and response are returned. An unreachable backend returns **502** and an upstream timeout returns **504**.
7. The gateway saves the result, including blocked calls, with time, method, path, client/service identity, status and duration.

API keys and admin cookies are not forwarded to sample services. Logs omit request headers, request bodies and query strings. Users should also avoid putting secrets inside URL paths or service/client names.

## Dashboard and admin login

The browser calls Next.js routes under `/api/platform`. These forward requests to the gateway, so the browser does not need cross-origin configuration. The gateway remains responsible for authentication and policy enforcement.

After a successful login, the gateway issues a random session token in an **HttpOnly, SameSite=Strict** cookie. The database stores its hash and an eight-hour expiry. Logout deletes the session. Cross-origin admin writes are rejected unless the origin is configured. Login attempts have a small separate limit.

The default admin credentials are local demo values. They can be changed in `.env`; the administrator account is configured through environment variables rather than a registration system. Password verification uses Node's scrypt and a constant-time comparison.

## Keys and rate limits

A new key is generated from cryptographically random bytes and displayed once. Lists only show its last six characters. Keys allow access to all enabled services in this academic version.

Each key has a request limit and a window length, for example **5 requests in 10 seconds**. Only accepted requests add timestamps. In Redis mode, removing expired timestamps, counting calls and inserting the new timestamp happen in one Lua script, preventing concurrent requests from exceeding the allowance. In local mode, the same decision happens synchronously within the single gateway process.

Changing a policy starts a bucket for that key/policy combination. Restoring a previous policy can reuse its still-active bucket. Backend errors and unknown routes consume allowance because the limiter runs before routing. Revocation prevents later calls immediately. Already-forwarded requests can still finish. If Redis is selected but unavailable, the gateway rejects calls with **503** rather than silently disabling limits.

## Data and audit history

| Table          | Contents                                                                   |
| -------------- | -------------------------------------------------------------------------- |
| `services`     | Names, prefixes, backend origins and enabled state.                        |
| `api_keys`     | Client names, key hashes, display hints, limits and revocation state.      |
| `sessions`     | Session hashes and expiry times.                                           |
| `request_logs` | Client traffic outcomes and timings.                                       |
| `audit_logs`   | Login/logout, service changes, key issuance/revocation and policy changes. |
| `app_meta`     | Tracks whether initial demo services have been seeded.                     |

Tables and indexes are created at startup. Demo routes are seeded once, so restarting does not undo a deliberate service deletion. Configuration changes and their audit entries share a database transaction. Deleting a service preserves its historic logs.

Sample user/product records are deliberately kept in memory and reset when those services restart. The sample services support list/search, fetch by ID, create and delete. Platform settings and logs persist separately.

## Source map

| Location                                             | Responsibility                                                          |
| ---------------------------------------------------- | ----------------------------------------------------------------------- |
| `apps/gateway/app.mjs`                               | Admin endpoints, authentication checks, routing, logging and analytics. |
| `apps/gateway/store.mjs`                             | Shared SQL schema, embedded/PostgreSQL adapters and initial data.       |
| `apps/gateway/limiter.mjs`                           | Local and Redis sliding-window implementations.                         |
| `apps/gateway/security.mjs`                          | Hashes, random tokens, password checking and session cookies.           |
| `apps/gateway/health.mjs`                            | Real sample-service, database and limiter checks.                       |
| `apps/dashboard/app/page.js`                         | Dashboard screens and interactions.                                     |
| `apps/dashboard/app/api/platform/[...path]/route.js` | Browser-to-gateway bridge.                                              |
| `services/`                                          | Users/products sample APIs.                                             |
| `tests/platform.test.mjs`                            | Integration, concurrency and persistence tests.                         |
| `scripts/demo-check.mjs`                             | Checks the running dashboard bridge and gateway together.               |
| `scripts/load-test.js`                               | Small k6 test with an exact 5-allowed/5-limited expectation.            |

## Deliberate limits

This project handles JSON APIs on a trusted local machine. It has one admin, no per-service key permissions, no billing, no multi-organization setup and no distributed deployment in local demo mode. Requests are limited to 1 MB, backend responses to 2 MB, and backend redirects are rejected. Logs have no automatic retention policy. If the database fails while saving a request log, the gateway reports that failure to its console; it cannot guarantee a complete log during an outage.

The next practical step is to run the Docker verification commands from the README when Docker is available, then use the built-in Demo guide for the project presentation. No additional feature phase is required for the academic scope.
