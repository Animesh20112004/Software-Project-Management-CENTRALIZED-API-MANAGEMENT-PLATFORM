# Verification record

Verified across 31 October and 1 November 2026 using the local demo mode.

| Check                           | Result                                                                                                                                                                                                                        |
| ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Automated tests                 | Passed: authentication, registration, GET/POST routing, input checks, disabled and unavailable routes, key revocation, concurrent limits, window recovery, filtered logs, audit history, logout and saved data after restart. |
| Dashboard production build      | Passed using webpack.                                                                                                                                                                                                         |
| Full HTTP demo check            | Passed through the Next.js bridge: 5 allowed / 5 limited calls, recovery, rejected keys, unknown route and saved logs.                                                                                                        |
| Browser workflow                | Verified login, key creation, service registration, a 10-request burst, log filtering and overview.                                                                                                                           |
| Local k6 load test              | Passed: 10 concurrent calls, exactly 5 allowed and 5 rate limited; all checks passed.                                                                                                                                         |
| Dependency audit                | No known vulnerabilities reported after compatible updates.                                                                                                                                                                   |
| Docker/PostgreSQL/Redis runtime | Not run: Docker and WSL are unavailable on this machine. Configuration and test commands are included.                                                                                                                        |

## Repeat the checks

Compose YAML was parsed successfully, all declared service dependencies resolve, and the sample services have no published host ports. This is a configuration check, not a container runtime test.

```sh
npm test
npm run build
```

With the platform running in another terminal:

```sh
npm run demo:check
k6 run --no-usage-report scripts/load-test.js
```

The demo and load checks create and revoke their own test keys. Their request/audit history remains visible as demo evidence. They expect the seeded `/users` route to be enabled and reachable.

With Docker installed and running:

```sh
npm run docker:up
npm run test:docker
npm run test:load
```

`test:docker` reruns the integration tests against real PostgreSQL and Redis. It creates a separate temporary PostgreSQL schema and removes that schema afterwards. The regular embedded persistence test also runs. It does not clear the demo database.

This small load test verifies policy correctness, not production throughput or scalability.
