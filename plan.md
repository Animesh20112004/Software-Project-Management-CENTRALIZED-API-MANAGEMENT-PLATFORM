# Centralized API Management Platform: Development Plan

Build a small academic prototype based on `SPM.pdf`. Each phase adds a working feature to the previous version and ends with a short demo.

## Tech stack

| Part | Technology |
| --- | --- |
| Language | JavaScript throughout |
| API gateway and admin backend | Node.js + Fastify |
| Admin dashboard | Next.js + Tailwind CSS |
| Configuration, request logs and audit history | PostgreSQL |
| Rate limiting | Redis Open Source, running locally |
| Two sample services | Express.js with sample users and products |
| Local setup | Docker Compose and Docker Desktop for education |
| Testing | Node.js test runner, curl and local k6 |
| Version control and tracking | Git and a Markdown checklist |

## Development phases

| Phase | What we build | Working result to demonstrate |
| --- | --- | --- |
| 1. Basic working setup | Create the dashboard, gateway and two sample services. Start local databases with Compose. Add a health check and a simple request button. | Open the dashboard and see a real response from the gateway. |
| 2. Service registration and routing | Save service names, route prefixes and backend addresses in PostgreSQL. Add a dashboard form to register services. Forward GET and POST requests through the gateway. | Register both services and call them through one gateway address. Show a clear error for an unknown route or unavailable service. |
| 3. API keys and admin access | Add one local admin login. Create and revoke client API keys from the dashboard. Store key hashes and validate keys before forwarding requests. | A valid key works. Missing, invalid and revoked keys return 401. Admin controls require login. |
| 4. Traffic limits | Use Redis to track requests in a sliding time window. Let the admin set a limit per client key, such as 5 requests in 10 seconds. | Send repeated requests from the dashboard. Extra requests return 429, and requests work again after the window clears. |
| 5. Logs and monitoring | Save request time, client identifier, route, status and response duration, including blocked calls. Record admin changes separately. Add log filters and basic traffic totals to the dashboard. | Make calls and see successes, failures and blocked requests. View the history of service, key and policy changes. Never log raw API keys or passwords. |
| 6. Final demo and checks | Check routing, key revocation, rate limits, saved settings and service failures. Run a small local k6 test, including concurrent calls. Finish Compose setup, seed data and a short README. | Start the full platform with one command and demonstrate registration, access control, rate limits and logs from start to finish. |

## Keep the scope small

- Use one gateway, one admin and two sample services with fake data.
- Keep backend services inside the local Compose network so demo clients use the gateway.
- Use basic dashboard tables and counters. Skip advanced charts, billing, multiple organizations, Kubernetes and production scaling.
- Finish and check each phase before starting the next. Save a Git commit after every working demo.

## Zero-cost approach

Run everything on our existing computers. No cloud hosting, domain, paid APIs, subscriptions, credit cards or trial credits are required. Run tests locally and use the checklist instead of Jira or hosted CI.

[Docker Desktop is free for education](https://docs.docker.com/subscription-billing/desktop-license/), and [Redis Open Source is free to run locally](https://redis.io/docs/latest/develop/setup/). Use the local editions rather than managed cloud services.
