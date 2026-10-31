# Centralized API Management Platform

A complete academic prototype for registering services, issuing API keys, limiting traffic and viewing request/audit history. Everything runs locally with free tools.

## Quick start (no Docker needed)

Install Node.js 22.9 or newer (Node.js 24 is recommended), then run:

```sh
npm ci
npm start
```

Open [http://localhost:3000](http://localhost:3000).

- Username: **admin**
- Password: **local-demo-123**

Two services are seeded automatically. Open **API keys**, create a key, then use **Request playground** to call `/users` or `/products`. The **Demo guide** in the dashboard walks through the whole project. Stop the apps with Ctrl+C.

The local demo saves settings, key hashes and logs in `data/platform` using PGlite (embedded PostgreSQL). Rate limiting runs in the single gateway process. Its counters reset on restart. The dashboard clearly labels this mode. No Docker, paid API, credit card or cloud account is needed for this demo.

## What is included

- Service registration, editing, enable/disable and deletion.
- Routing by prefix, with GET and POST support plus forwarding for other common HTTP methods.
- Admin login/logout and client API key creation/revocation.
- Configurable sliding-window limits and clear 401 / 429 / 404 / 502 / 504 errors.
- Request logs with filters and pagination, audit history and traffic summaries.
- Sample user/product APIs with fake data.
- Integration tests, a running-demo check, k6 load testing, Docker files and documentation.

## Full Docker setup (PostgreSQL + Redis)

Install and start Docker Desktop with its Windows prerequisites. Stop any local copy using the same ports, then run:

```sh
npm run docker:up
```

Or, without installing Node on the host:

```sh
docker compose up --build -d --wait
```

This starts all six components. Only the dashboard (3000), gateway (4000) and database ports are published on loopback. The users/products services are accessible only inside the Compose network. PostgreSQL settings/logs persist in a named volume. Docker and local demo mode use separate databases.

```sh
npm run docker:down
```

This stops containers without deleting PostgreSQL data. **Docker runtime verification is still pending on this machine because Docker/WSL is not installed.** The local demo is tested and usable now.

## Useful commands

| Command                      | Purpose                                                    |
| ---------------------------- | ---------------------------------------------------------- |
| `npm start` or `npm run dev` | Start all four local application processes.                |
| `npm test`                   | Run isolated integration and persistence tests.            |
| `npm run build`              | Compile the dashboard for deployment.                      |
| `npm run demo:check`         | Check the running dashboard, gateway and service together. |
| `npm run db:up`              | Start only Docker PostgreSQL and Redis.                    |
| `npm run db:down`            | Stop only those database containers.                       |
| `npm run test:docker`        | Test using real PostgreSQL and Redis through Compose.      |
| `npm run test:load`          | Run k6 inside Compose against the Docker gateway.          |

If k6 is installed locally, `k6 run --no-usage-report scripts/load-test.js` tests the local gateway. It creates a temporary key, sends 10 concurrent requests with a limit of 5, checks the exact counts and revokes the key afterwards. No cloud service is involved.

## Configuration and addresses

Copy `.env.example` to `.env` to customize the admin credentials, ports or mode. Restart after changes. For local applications using Docker databases, set `DB_MODE=postgres` and `RATE_LIMIT_MODE=redis`, and run `npm run db:up` before `npm start`.

| Component                | Default address                        |
| ------------------------ | -------------------------------------- |
| Dashboard                | `http://localhost:3000`                |
| Gateway                  | `http://127.0.0.1:4000`                |
| Protected users route    | `http://127.0.0.1:4000/proxy/users`    |
| Protected products route | `http://127.0.0.1:4000/proxy/products` |
| Gateway health           | `http://127.0.0.1:4000/health`         |
| Dependency health        | `http://127.0.0.1:4000/system/health`  |

External demo clients supply `X-API-Key`. For example, replace `YOUR_KEY` with a newly issued key:

```sh
curl -H "X-API-Key: YOUR_KEY" http://127.0.0.1:4000/proxy/users
```

Use `curl.exe` in Windows PowerShell if `curl` is an alias. Registered backend URLs contain only an origin, such as `http://127.0.0.1:4001`. The gateway keeps the request path after removing `/proxy`.

## Common issues

- **A port is already in use:** stop the old demo or adjust the ports in `.env`. If a sample service address changes, update its saved registration in Services.
- **Gateway unavailable:** check the terminal for a startup error. Local startup takes a few seconds to open its database on the first run.
- **401 on a client request:** use an active key in `X-API-Key`. Admin login alone does not authorize client requests.
- **429:** wait for the configured window or edit the client's policy.
- **502/504:** check that the registered backend is running and its address is correct for the selected mode.
- **Different data after switching modes:** local and Docker databases are separate; data is not migrated automatically.

## Project documentation

- [Complete project guide (PDF): connected walkthrough, every file, API reference and future improvements](output/pdf/Centralized_API_Platform_Project_Guide.pdf)
- [Implementation and request logic](IMPLEMENTATION.md)
- [Checks and verification limits](VERIFICATION.md)
- [Original development plan](plan.md)
- [Historical Phase 1 guide](phase-1-documentation.md)

The project intentionally stays small: one admin, two sample services, JSON requests and basic analytics. Sample service records reset on service restart. Platform configuration and logs persist. It is a local academic demo, with no billing, cloud deployment or production scaling.
