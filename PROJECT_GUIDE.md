# Centralized API Platform: the complete project guide

This guide explains the project as a connected story: why it exists, what happens when it starts, how an administrator sets it up, and how a request travels through it. It then connects that story to the files, database, tests, and possible improvements.

It describes the code in this repository as of **1 November 2026**. The project is an academic prototype that runs locally without paid APIs, subscriptions, cloud accounts, or billing. The local mode has been tested. The Docker configuration is included, but its PostgreSQL/Redis runtime verification is still pending on a machine with Docker available.

For a quick start, read [README.md](README.md). For a shorter explanation, read [IMPLEMENTATION.md](IMPLEMENTATION.md). This document is the longer guide for understanding and explaining the code.

## Guide map

1. [The problem and the idea](#1-the-problem-and-the-idea)
2. [The parts and the technology stack](#2-the-parts-and-the-technology-stack)
3. [Starting the project](#3-starting-the-project)
4. [The administrator signs in](#4-the-administrator-signs-in)
5. [Registering a service](#5-registering-a-service)
6. [Giving a client an API key](#6-giving-a-client-an-api-key)
7. [Following one request from beginning to end](#7-following-one-request-from-beginning-to-end)
8. [How the rate limiter makes its decision](#8-how-the-rate-limiter-makes-its-decision)
9. [What the platform remembers about a request](#9-what-the-platform-remembers-about-a-request)
10. [How the dashboard code works](#10-how-the-dashboard-code-works)
11. [How the database is organized](#11-how-the-database-is-organized)
12. [The sample services](#12-the-sample-services)
13. [The complete file structure](#13-the-complete-file-structure)
14. [Endpoint reference](#14-endpoint-reference)
15. [Configuration and commands](#15-configuration-and-commands)
16. [The Docker version](#16-the-docker-version)
17. [Tests and verification](#17-tests-and-verification)
18. [Troubleshooting by following the request](#18-troubleshooting-by-following-the-request)
19. [Current boundaries and future improvements](#19-current-boundaries-and-future-improvements)
20. [How to read and extend the code](#20-how-to-read-and-extend-the-code)
21. [A connected demonstration](#21-a-connected-demonstration)
22. [Small glossary](#22-small-glossary)

## 1. The problem and the idea

Imagine that a college application has two small APIs. One returns users; the other returns products. An **API** is a set of addresses that another program can call to read or change data.

If every client calls each service directly, each service would need its own rules for access, request limits, and request history. The same work would be repeated in several places.

This project puts an **API gateway** in front of those services. The gateway is one entry point. A client sends its request there, and the gateway decides whether to allow it and where to send it.

An administrator manages these decisions through a dashboard. The administrator registers services, issues API keys, sets limits, and checks what happened. The sample services focus on returning their own data.

There are three roles in the story:

| Role            | What it does in this project                                                                            |
| --------------- | ------------------------------------------------------------------------------------------------------- |
| Administrator   | Signs into the dashboard and manages services, keys, and policies.                                      |
| API client      | Sends requests with an API key. It could be a script, another application, or the dashboard playground. |
| Backend service | Receives allowed requests from the gateway and returns data. The examples are Users and Products.       |

The sample users returned by `/users` are fake API data. They are **not** administrator accounts, and creating one does not create a dashboard login.

The original [presentation](SPM.pdf) and [plan](plan.md) describe the phased development. The current implementation joins those phases into one working local prototype.

## 2. The parts and the technology stack

There are two connected paths through the application:

```text
Managing the platform:
Browser dashboard -> Next.js bridge -> Gateway admin endpoints -> Database
                        sends cookie       checks session

Using the platform:
API client -> Gateway -> API key check -> Rate limiter -> Matching service
                 |                                          |
                 +------------- saved request log <--------- response

The dashboard playground is also an API client:
Playground -> Next.js bridge -> Gateway proxy -> Same checks and service
```

The **bridge** is a small server-side forwarding route inside Next.js. It lets the browser call the same address that served the dashboard. The gateway still makes the access and routing decisions.

### Technology choices

| Technology                       | Where it is used            | Its job                                                                            |
| -------------------------------- | --------------------------- | ---------------------------------------------------------------------------------- |
| JavaScript and Node.js           | Server code, scripts, tests | Run the application and its tools. The package requires Node 22.9 or newer.        |
| Next.js 16 and React 19          | Dashboard                   | Render the interface and provide the browser-to-gateway bridge.                    |
| Tailwind CSS 4 and custom CSS    | Dashboard styling           | Provide the styling setup, layout, colors, forms, tables, and responsive behavior. |
| Fastify 5                        | Gateway                     | Define endpoints, validate input, run authentication checks, and forward requests. |
| Express 5                        | Sample services             | Provide small Users and Products APIs.                                             |
| PGlite                           | Default database mode       | Run an embedded PostgreSQL engine inside the gateway and save data locally.        |
| PostgreSQL with the `pg` package | External database mode      | Store the same platform tables in a separate database server.                      |
| JavaScript `Map`                 | Default rate-limit mode     | Keep recent request times inside one gateway process.                              |
| Redis with the `redis` package   | External rate-limit mode    | Share request counters and make each limit decision atomically.                    |
| Node's built-in crypto tools     | Authentication              | Generate random secrets, hash tokens, and verify the admin password.               |
| Node's test runner               | Automated tests             | Check the gateway, database behavior, and sample service integration.              |
| k6                               | Small load test             | Send concurrent requests and check the exact allowed/blocked counts.               |
| Docker Compose                   | Optional full setup         | Run the applications, PostgreSQL, and Redis as connected containers.               |
| Prettier                         | Development                 | Keep source formatting consistent.                                                 |

The version ranges are in [package.json](package.json). [package-lock.json](package-lock.json) records the exact dependency versions used by `npm ci`. Application code uses JavaScript modules through `import` and `export`; this is why many server files end in `.mjs`.

### Two runtime modes, the same features

| Question                              | Local demo mode               | Full Docker mode                                   |
| ------------------------------------- | ----------------------------- | -------------------------------------------------- |
| Database                              | PGlite in the gateway process | Separate PostgreSQL container                      |
| Database location                     | `data/platform` by default    | Docker's `postgres_data` named volume              |
| Rate-limit state                      | Memory in one gateway process | Redis container                                    |
| Application processes                 | Four local Node processes     | Dashboard, gateway, Users, and Products containers |
| Extra database installation required? | No                            | Docker starts PostgreSQL and Redis                 |
| Runtime verified here?                | Yes                           | Not yet; configuration was checked                 |

Both modes expose the same dashboard features. The default mode makes the academic demonstration possible with just Node.js. Switching database modes does **not** transfer existing data between them.

## 3. Starting the project

From the project folder, run:

```sh
npm ci
npm start
```

Then open [http://localhost:3000](http://localhost:3000). The default login is `admin` / `local-demo-123`.

`npm ci` installs the versions in the lockfile. `npm start` loads `.env` if it exists and runs [scripts/dev.mjs](scripts/dev.mjs). Without `.env`, the application uses its local defaults.

The launcher starts four child processes:

| Process          | Starting file or command                       | Default port |
| ---------------- | ---------------------------------------------- | ------------ |
| Dashboard        | Next.js development server in `apps/dashboard` | 3000         |
| Gateway          | `apps/gateway/server.mjs`                      | 4000         |
| Users service    | `services/users/server.mjs`                    | 4001         |
| Products service | `services/products/server.mjs`                 | 4002         |

The launcher passes the correct local service addresses to its children. Their terminal output appears together. Ctrl+C stops the group. If a child unexpectedly exits or fails to start, the launcher shuts down the others so a partially running demo is easier to notice.

**In this repository, `npm start` and `npm run dev` both start development mode.** `npm run build` compiles the dashboard but does not start a production server. The Docker dashboard uses the compiled application with `next start`.

### What the gateway prepares before accepting requests

[server.mjs](apps/gateway/server.mjs) calls `buildGateway()` from [app.mjs](apps/gateway/app.mjs). That function assembles the application:

1. Create the Fastify server and its request-size limit.
2. Read credentials, service addresses, and allowed dashboard origins.
3. Open the chosen database through `createStore()`.
4. Create the chosen request limiter and a separate login-attempt limiter.
5. Prepare the password verifier.
6. Seed the two demo service registrations if this database has never been seeded.
7. Register health, login, service, key, monitoring, and proxy endpoints.
8. Register cleanup behavior for shutdown.

Only after this preparation does `server.mjs` listen on the gateway port. If a required selected database or Redis connection cannot initialize, the gateway does not silently replace it with another mode.

### Why the demo services appear automatically

`store.mjs` creates the tables if they do not exist. Its `seed()` function checks a marker named `seed-v1` in `app_meta`.

On a new database, it saves that marker, registers `/users` and `/products`, and adds a `demo.seeded` audit event. These writes share a transaction, so they succeed together or roll back together.

On later starts, the marker already exists. The seed is skipped. This matters because deleting a service deliberately should not cause it to reappear on the next restart. It also means changing a sample service's port does not automatically update an existing saved registration.

## 4. The administrator signs in

The dashboard is a React page in [page.js](apps/dashboard/app/page.js). When it loads, it calls `/api/platform/admin/me` to ask whether the browser already has a valid session. A valid session opens the dashboard; otherwise, the page shows the sign-in form.

On sign-in, the following happens:

1. The form sends the username and password to `/api/platform/admin/login`.
2. The Next.js bridge forwards the request to `/admin/login` on the gateway.
3. The gateway checks a login-attempt limit: 10 attempts in 60 seconds for the IP address it sees.
4. It compares the username with `ADMIN_USER` and verifies the password against `ADMIN_PASSWORD`.
5. It generates a random session token and saves only its hash, with an eight-hour expiry, in `sessions`.
6. It returns the token in a browser cookie and records `admin.login` in the audit history.
7. The bridge passes the cookie back to the browser. Later admin requests carry it automatically.

The login limiter counts successful and unsuccessful attempts. Through the dashboard bridge, the gateway sees the bridge's network address, so these attempts can share a bucket. This prototype does not implement trusted forwarding of each browser's IP address.

### Password, token, and cookie: three different things

The password is a configured value; there is no user-registration table. `passwordVerifier()` in [security.mjs](apps/gateway/security.mjs) derives a value using Node's `scrypt`, a random salt, and a constant-time comparison. That verifier exists in the gateway process.

The session token is a new random secret created after login. Its SHA-256 hash is stored in the database. On each protected admin call, `requireAdmin()` hashes the incoming token and looks for a matching unexpired session.

The cookie is named `platform_session`. It has:

| Setting           | Meaning here                                                          |
| ----------------- | --------------------------------------------------------------------- |
| `HttpOnly`        | Browser JavaScript cannot read the session cookie.                    |
| `SameSite=Strict` | The browser restricts sending it in cross-site situations.            |
| `Path=/`          | It can accompany requests throughout this application.                |
| `Max-Age=28800`   | The browser lifetime is eight hours. The database also checks expiry. |
| Optional `Secure` | Added when `COOKIE_SECURE=true`; intended for HTTPS.                  |

Admin write requests with an `Origin` header must match `DASHBOARD_ORIGINS`. This is an additional browser-origin check. Requests without that header, such as a command-line client, still need authentication for protected endpoints.

Logout removes the current session from the database, clears the cookie, and records `admin.logout`. Expired sessions are rejected during authentication and cleaned up when another login succeeds. Changing the configured password does not automatically revoke other existing sessions; they remain valid until logout or expiry.

### Admin access and client access are separate

An admin cookie authorizes service and key management. An API key authorizes a client call through `/proxy`. Signing into the dashboard does not make a playground call valid without an API key. An API key does not authorize the admin endpoints.

## 5. Registering a service

After signing in, the administrator can open **Services**. A registration tells the gateway where an existing backend can be found.

For example:

```json
{
  "name": "Users",
  "prefix": "/users",
  "base_url": "http://127.0.0.1:4001",
  "enabled": true
}
```

Here, `prefix` is the path the gateway should recognize. `base_url` is the backend's **origin**: its protocol, hostname, and optional port. It must not contain an application path, query, credentials, or fragment.

The dashboard sends the form through the bridge. The gateway validates it, generates an ID, writes a row in `services`, and adds an audit event in the same database transaction. Editing and deleting follow the same pattern.

The main rules are:

- The name must be nonblank and no longer than 80 characters.
- The prefix must start with `/`, use letters, numbers, `_`, or `-` within its segments, and be no longer than 100 characters.
- A prefix must be unique. Two services cannot register the same prefix.
- The backend URL must use HTTP or HTTPS and contain only an origin.
- A new registration is enabled by default. Updating it supplies all four fields.

Registration does not create or start a backend. The service must already run at the given address. Registration also does not prove that the backend is reachable; forwarding is where an unavailable backend becomes visible.

### Matching paths correctly

The gateway searches enabled registrations from the longest prefix to the shortest. A match must end at a path boundary.

| Registered prefix             | Request path after `/proxy` is removed | Result                |
| ----------------------------- | -------------------------------------- | --------------------- |
| `/users`                      | `/users`                               | Matches               |
| `/users`                      | `/users/1`                             | Matches               |
| `/users`                      | `/users-other`                         | Does not match        |
| `/users` and `/users/reports` | `/users/reports/monthly`               | `/users/reports` wins |

Only the leading `/proxy` is removed. The registered prefix remains in the forwarded path. Registering `/people` against the Users backend does not rename its `/users` endpoint; that backend would also need to implement `/people`.

Disabling a registration stops future matching requests from using it. Deleting it removes the registration, not the backend process or old logs. Since the gateway reads registrations from the database on each client request, changes take effect on later requests without restarting it.

## 6. Giving a client an API key

Now the gateway knows where services are, but it still needs to know which clients may call them. The administrator opens **API keys** and creates a key with a name and policy:

```json
{
  "name": "College demo client",
  "rate_limit": 5,
  "window_seconds": 10
}
```

This policy means the key can pass the rate-limit check at most five times within any moving ten-second window. Limits can be 1–10,000 requests, and windows can be 1–3,600 seconds.

The gateway generates 32 random bytes, encodes them as text, and prefixes the result with `cap_`. It stores the key's SHA-256 hash, the final six characters as a display hint, its name, and its policy.

The complete key is returned **only in the creation response**. The dashboard displays it and fills the playground's key field. Later list responses contain the hint and policy, but neither the full key nor its hash.

A hash is a one-way fingerprint used for comparison. When a client sends a key, the gateway hashes it again and looks for the matching database row. It does not need to store the original secret to recognize it.

The dashboard holds a newly created key in browser memory, not local storage. Reloading loses that copy. If the key is lost, create another one and revoke the old one.

### What a key permits

In this version, each active key can call **all enabled services**. Its request allowance is shared across those services. The client name is a label for identifying traffic; there is no separate client-account system.

Editing a key changes its rate policy. Revoking it sets `revoked=true`, so future calls fail with 401. The row remains for history. A request already forwarded before revocation can still finish.

Keys have no automatic expiry, per-service permissions, or built-in rotation workflow. Those are possible later extensions.

## 7. Following one request from beginning to end

Suppose a client wants to search for Asha in the Users service:

```sh
curl -H "X-API-Key: YOUR_KEY" "http://127.0.0.1:4000/proxy/users?q=Asha"
```

Replace `YOUR_KEY` with a newly issued key. In Windows PowerShell, use `curl.exe` if `curl` is an alias.

### Step 1: Reach the gateway

A direct API client calls port 4000. The playground instead calls `/api/platform/proxy/users?q=Asha` on port 3000, and the bridge forwards it to the same gateway route.

The gateway records a start time. The eventual response uses `Cache-Control: no-store`, so these management and request results are not intended to be reused from a cache.

### Step 2: Identify the client

The proxy handler reads `X-API-Key`, checks its basic format and length, hashes it, and looks it up in `api_keys`. A missing, unknown, or revoked key returns 401. No backend is called in those cases.

Once a key is recognized, its ID and name are attached to the request for later logging. This is also why a request using a known revoked key can still appear with a client name in the logs.

### Step 3: Check the allowance

The gateway calls `limiter.consume()` using the key ID and current policy. If no allowance remains, it returns 429 with `Retry-After`. Otherwise, the request continues and receives `X-RateLimit-Limit` and `X-RateLimit-Remaining` response headers.

This check happens before routing. An allowed call to an unknown route, or one that later fails at the backend, still uses allowance. Invalid keys do not reach this limiter.

### Step 4: Find the destination

The gateway removes `/proxy`, separates the pathname from its query for matching, rejects malformed or disallowed path encodings, and finds the longest enabled prefix match.

In this example, `/users` matches the Users registration. If there is no match, the gateway returns 404.

### Step 5: Call the backend

The resulting URL is:

```text
Registered origin:       http://127.0.0.1:4001
Remaining path + query:  /users?q=Asha
Backend request:         http://127.0.0.1:4001/users?q=Asha
```

The gateway preserves the HTTP method and query. For requests with a body, it serializes the parsed body as JSON. For example, a POST to `/proxy/users` with `{"name":"Mira","role":"Student"}` reaches the backend's `POST /users`.

Only a small set of headers is sent to the backend: an `Accept` value and, when needed, JSON content type. Client API keys and admin cookies are not forwarded to sample services.

### Step 6: Return the result

The Users service searches its in-memory array and returns JSON. The gateway passes the backend's status and response body back to the client. JSON stays JSON; other content is returned as plain text with `X-Content-Type-Options: nosniff`.

The upstream timeout is five seconds. Backend redirects are rejected, and responses larger than 2 MiB are rejected. The gateway accepts request bodies up to 1 MiB. This is a small JSON-oriented proxy, not a general file-transfer or streaming proxy.

### Step 7: Save the outcome

Before the gateway finishes sending the response, its `onSend` hook saves a request log. This happens for both successful proxy calls and proxy errors, including rejected keys and rate-limited calls. The dashboard can then retrieve that history and calculate traffic summaries.

### Understanding an error by where it happened

| Status | Meaning in this project                                                                       | Likely place to inspect                         |
| ------ | --------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| 400    | Invalid form, JSON, policy, or path; or invalid sample record                                 | Gateway validation or sample service validation |
| 401    | Missing/expired admin session, or missing/invalid/revoked API key                             | Admin authentication or proxy key check         |
| 403    | Admin write came with a disallowed origin                                                     | Gateway origin check                            |
| 404    | Registration/record not found, no enabled route, or backend endpoint missing                  | Service registry or backend                     |
| 409    | A service prefix is already registered                                                        | Database uniqueness check                       |
| 413    | Request body exceeds the allowed size                                                         | Next.js bridge or gateway                       |
| 429    | Client allowance or login-attempt limit reached                                               | Corresponding limiter                           |
| 502    | Backend unreachable, redirect rejected, or response too large; also bridge-to-gateway failure | Gateway forwarding or Next.js bridge            |
| 503    | A required gateway component is unavailable, or dependency health is degraded                 | Database, limiter, or health check              |
| 504    | Gateway timed out waiting for the backend                                                     | Backend response time                           |

The same status can come from more than one layer. Read the response message and identify whether a request reached the gateway. A failure in the Next.js bridge before reaching it will not have a gateway request log.

## 8. How the rate limiter makes its decision

The limiter implements a **sliding window**. It remembers the times of requests that passed its check and looks backward over the configured window every time a new request arrives.

For a policy of three requests in ten seconds:

| Time       | Existing accepted calls still inside the window | Decision                            |
| ---------- | ----------------------------------------------- | ----------------------------------- |
| 0 seconds  | None                                            | Allow; remember time 0              |
| 2 seconds  | 0                                               | Allow; remember time 2              |
| 4 seconds  | 0, 2                                            | Allow; remember time 4              |
| 5 seconds  | 0, 2, 4                                         | Block; do not add another timestamp |
| 10 seconds | 2, 4; time 0 has expired                        | Allow; remember time 10             |

The allowance does not reset for everyone at a fixed wall-clock boundary. Each accepted timestamp expires individually. `Retry-After` tells the client how many seconds to wait for the oldest counted request to leave the window, assuming other traffic does not consume the newly available space.

### Local implementation

[limiter.mjs](apps/gateway/limiter.mjs) uses a `Map`. Each bucket holds recent timestamps and an expiry. It removes old timestamps, checks the count, and adds the current timestamp only if allowed. That decision is synchronous inside one gateway process, so simultaneous calls cannot interrupt its update halfway through. A periodic cleanup removes unused expired buckets.

This works for the single local gateway. Restarting it clears these counters. Two separate gateway processes with separate memory maps would not share a limit.

### Redis implementation

Redis stores a sorted set for each bucket. Timestamp scores make old entries easy to remove. Each accepted request gets a unique member, so requests in the same millisecond are still separate entries.

One Lua script removes old entries, counts the remaining ones, either rejects the request or inserts its timestamp, and sets expiry. Redis executes that script atomically: another request cannot slip between the count and insertion. This is what lets several gateway instances share a decision safely.

The timestamps come from the gateway's clock. A future deployment with several machines would need to consider clock consistency. The current Compose file does not configure a persistent Redis volume, so the project does not promise counter survival when that container is recreated.

### Policy changes and failures

A bucket is identified by `key ID + rate limit + window seconds`. Changing a policy selects a different bucket. Restoring an earlier policy can reuse its previous bucket if its timestamps have not expired.

In Redis mode, a Redis failure is an error, not permission to skip the limit. A client request fails with 503 if the required limiter operation fails. The separate login-attempt limiter always uses memory.

## 9. What the platform remembers about a request

Once routing and access control work, the administrator needs to understand the results. Three features provide different views of the same activity: request logs, audit history, and analytics.

### Request logs: what clients attempted

For calls under `/proxy`, the gateway saves:

| Field                    | Explanation                                                              |
| ------------------------ | ------------------------------------------------------------------------ |
| Time and log ID          | When the row was created and its sequence number.                        |
| Client ID and name       | The recognized key's identity, if available.                             |
| Service ID and name      | The matched service, if routing reached that point.                      |
| Method and path          | For example, `GET /proxy/users`.                                         |
| Status                   | The result, such as 200, 401, or 429.                                    |
| Duration in milliseconds | Time from gateway request start to the point just before saving the log. |

A blocked request may have no service because key and rate-limit checks run before service matching. An unknown key also has no client identity. Such entries appear as unmatched or not routed; that does not mean a backend failed.

The stored path excludes the query string and is capped at 512 characters. Request bodies, headers, raw keys, and session tokens are not stored in these logs. URL paths and client/service names are still recorded, so those fields should contain ordinary identifiers rather than secrets.

Duration includes gateway work and any backend wait. It does not include the log insert itself or the complete browser round trip. The playground's visible duration also includes travel through Next.js, so those two numbers need not be identical.

The request log is attempted before sending completes. If saving it fails, the gateway writes a console error and still returns the response. A database outage can therefore leave gaps in request history.

### Filtering and pagination

The Logs screen can filter by status, client, service, and path text. Supplied filters are combined: a row must satisfy all of them. The backend uses parameterized SQL, so supplied values are passed separately from SQL instructions.

The API returns the matching row count and one page of results, newest first. The dashboard displays 20 at a time. The API also accepts a `limit` up to 100 and an `offset` indicating how many matching rows to skip.

Path filtering uses SQL `ILIKE` with a surrounding wildcard. It is case-insensitive; `%` and `_` entered into that filter retain SQL wildcard meaning.

### Audit history: what changed in the platform

An audit event describes an administrative action rather than a client API request. Events include:

| Event                                                   | Trigger                                                    |
| ------------------------------------------------------- | ---------------------------------------------------------- |
| `demo.seeded`                                           | A new database receives the initial service registrations. |
| `admin.login`, `admin.logout`                           | A successful sign-in or sign-out.                          |
| `service.created`, `service.updated`, `service.deleted` | A registration changes.                                    |
| `key.created`, `key.policy_updated`, `key.revoked`      | A key is issued or its access policy changes.              |

Each event has a time, actor, action, optional entity ID, and JSON details. Failed logins are not currently audited. Audit pages contain 20 rows, newest first.

A service/key change and its audit entry use one transaction. If either write fails, neither is committed. Forwarding a remote request and saving its traffic log are a different process; they cannot share that same database transaction.

### Analytics: a summary of saved logs

The Overview screen reads aggregates calculated from `request_logs`:

| Metric           | Actual calculation                                                     |
| ---------------- | ---------------------------------------------------------------------- |
| Total            | All saved proxy request rows.                                          |
| Successful       | Rows with status below 400.                                            |
| Blocked          | Rows with status 401 or 429.                                           |
| Failed           | Rows with status 400 or above, including blocked rows.                 |
| Average duration | Rounded average of saved durations across all statuses.                |
| Service activity | Counts and errors grouped by saved service name, with up to 20 groups. |

**Blocked is part of Failed**, so those two counts should not be added together as separate categories. Totals cover all recorded requests; there is no date-range selector or automatic retention yet. Grouping uses saved service names, so renaming a service can create separate historical name groups.

Admin calls and health checks are not counted as client traffic. They do not inflate these analytics.

### Health: can the components respond now?

`GET /health` confirms that the gateway can answer a basic request. `GET /system/health` does more: [health.mjs](apps/gateway/health.mjs) checks the Users service, Products service, database, and limiter in parallel. The response also includes the gateway itself, making five component entries.

The service checks call `/health`; the database check runs `SELECT 1`; the limiter check calls its `ping()` method. An in-memory limiter has no separate server to contact. Service HTTP checks have a 1.5-second timeout. All healthy returns 200; a failed dependency returns 503 with useful component data.

These checks use the configured sample-service addresses. They do not automatically test every custom registered service. The dashboard refreshes health when loading or refreshing relevant views; it does not maintain a live WebSocket health stream.

## 10. How the dashboard code works

The interface is mostly contained in one client-side React component, `Platform`, in [page.js](apps/dashboard/app/page.js). This keeps the academic version easy to locate, although splitting it into smaller files would help as it grows.

### The page's basic cycle

```text
User opens the page
  -> Check existing admin session
  -> Show login or dashboard
  -> Fetch services, keys, analytics, and health
  -> User selects a screen or submits a form
  -> Send an API request
  -> Gateway validates and changes/reads data
  -> Update React state
  -> React redraws the affected interface
```

**State** means values the page remembers while it is open: the current tab, form inputs, loaded rows, loading status, and messages. That state is not the permanent database. Refreshing the browser reconstructs it from API calls.

### Main helpers in `page.js`

| Helper or state group                     | Responsibility                                                                                                                |
| ----------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `nav` and `tab`                           | Define the navigation items and choose the visible screen.                                                                    |
| `api()`                                   | Call `/api/platform`, parse JSON, and turn unsuccessful admin responses into errors. An admin 401 clears the signed-in state. |
| `loadHealth()`                            | Read component health, including a useful degraded response with status 503.                                                  |
| `refresh()`                               | Load service registrations, keys, and analytics, then health.                                                                 |
| Startup effects                           | Check the existing session and load dashboard data after a user is known.                                                     |
| `action()`                                | Set the busy state, clear old notices, run an operation, display an error if needed, and clear busy state.                    |
| `navigate()`                              | Switch screens and load data required by the selected view.                                                                   |
| `login()`                                 | Submit credentials and update signed-in state.                                                                                |
| `saveService()`                           | Choose create or update, submit the form, and refresh the saved list.                                                         |
| `createKey()`                             | Convert policy inputs to numbers, issue a key, and keep its one-time value for display/playground use.                        |
| `requestOnce()`                           | Validate playground input, send the client request, and collect its response, status, duration, and limit headers.            |
| `send()`                                  | Send one request or run a burst of ten GET requests concurrently.                                                             |
| `loadLogs()` and `loadAudit()`            | Fetch a page of traffic or audit history.                                                                                     |
| `Badge`, `Empty`, `Pager`, `PolicyFields` | Reusable presentation helpers for status labels, empty lists, pagination, and rate-limit inputs.                              |

The playground uses its own response handling. A client request returning 401 is a valid result to display; it must not sign the administrator out.

### Screens and their connections

| Screen             | What the user does                                               | Gateway data or action                      |
| ------------------ | ---------------------------------------------------------------- | ------------------------------------------- |
| Sign-in            | Enter admin credentials                                          | `/admin/login`, `/admin/me`                 |
| Overview           | Inspect health, totals, and service traffic                      | `/system/health`, `/admin/analytics`        |
| Services           | Add, edit, disable, enable, or delete registrations              | `/admin/services` and `/admin/services/:id` |
| API keys           | Issue a key, copy its one-time value, edit limits, revoke access | `/admin/keys` and key-specific routes       |
| Request playground | Send a GET, POST, or DELETE; run a ten-GET burst                 | `/proxy/...`                                |
| Request logs       | Apply filters and browse pages                                   | `/admin/logs`                               |
| Audit trail        | Browse configuration events                                      | `/admin/audit`                              |
| Demo guide         | Follow the built-in demonstration instructions                   | Static explanatory content                  |

These screens are conditional sections of the same page at `/`. Clicking a tab does not navigate to a separate Next.js page URL. Reloading starts with the default tab again.

The request playground parses a JSON body before sending it. Burst mode is GET-only to avoid creating or deleting ten records accidentally. It counts each returned status and displays the result. The new-key value is kept only in memory, and signing out clears the active key and request-result state.

Log filters have an editable state and an applied state. Clicking Apply uses the current filter values; pagination continues using the last applied filters instead of unfinished edits.

### The bridge keeps browser communication simple

[app/api/platform/[...path]/route.js](apps/dashboard/app/api/platform/%5B...path%5D/route.js) is a Next.js catch-all route. The bracketed folder means it can receive several path segments after `/api/platform`.

For example:

```text
Browser calls:   /api/platform/admin/services
Captured path:   ["admin", "services"]
Bridge calls:    GATEWAY_URL + /admin/services
```

The bridge only accepts the first path segment `admin`, `proxy`, `health`, or `system`. It forwards the cookie, content type, API key, and origin when present. It forwards the query and request body, applies a 1 MiB body check, and waits up to 15 seconds for the gateway.

On the way back, it copies the status, body, and selected headers, including the session cookie and limit headers. It does not directly access PostgreSQL, create keys, or enforce client policies. Those responsibilities stay in the gateway.

The older [app/api/gateway/[action]/route.js](apps/dashboard/app/api/gateway/%5Baction%5D/route.js) remains from Phase 1. It offers only the old `health` and `system` health forwarding actions. The current dashboard uses `/api/platform`.

## 11. How the database is organized

[store.mjs](apps/gateway/store.mjs) is the boundary between application behavior and database connection details. The gateway receives a store with these operations:

| Operation                     | Meaning                                                                    |
| ----------------------------- | -------------------------------------------------------------------------- |
| `query(sql, values)`          | Read or write rows using SQL and separate parameter values.                |
| `transaction(fn)`             | Run related changes together, committing all of them or rolling them back. |
| `seed(usersUrl, productsUrl)` | Add the initial registrations once.                                        |
| `close()`                     | Release the database connection/resources.                                 |
| `mode`                        | Tell health reporting whether the store is embedded or PostgreSQL.         |

The gateway uses the same interface in either mode. PGlite supplies the embedded database; PostgreSQL mode uses a connection pool with up to eight connections. The external pool has connection and statement timeouts so a database operation does not wait indefinitely.

### Tables and fields

| Table          | Fields                                                                                                                  | Why it exists                                                   |
| -------------- | ----------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| `services`     | `id`, `name`, `prefix`, `base_url`, `enabled`, `created_at`                                                             | The registry the proxy searches to choose a backend.            |
| `api_keys`     | `id`, `name`, `key_hash`, `hint`, `rate_limit`, `window_seconds`, `revoked`, `created_at`                               | Recognize client keys and load their current policies.          |
| `sessions`     | `token_hash`, `expires_at`                                                                                              | Recognize signed-in administrators until their session expires. |
| `request_logs` | `id`, `created_at`, `client_id`, `client_name`, `service_id`, `service_name`, `method`, `path`, `status`, `duration_ms` | Explain individual client requests and provide analytics input. |
| `audit_logs`   | `id`, `created_at`, `actor`, `action`, `entity_id`, `details`                                                           | Record successful administrative actions and initial seeding.   |
| `app_meta`     | `name`                                                                                                                  | Store the `seed-v1` marker.                                     |

Service and key IDs are UUID strings. Request and audit log IDs are increasing database-generated numbers. Most times are database timestamps; `sessions.expires_at` is an epoch time in milliseconds so it can be compared with `Date.now()`.

`prefix` and `key_hash` are unique. Key policy ranges are checked by both request validation and database constraints. `details` is a JSONB field, allowing each audit action to store an appropriate small object.

### Relationships without deleting history

```text
services.id  -> request_logs.service_id
api_keys.id  -> request_logs.client_id
changed ID  -> audit_logs.entity_id
```

These are logical connections, not enforced foreign-key constraints in the current schema. Log rows also save the names as they were at request time. Deleting or renaming a registration therefore does not erase or rewrite old history.

Indexes exist for request creation time and client ID. They help relevant lookups as history grows, although the prototype does not attempt to optimize every possible large-data query.

### Persistence is different for different data

| Data                                              | Where it lives                                 | After a normal restart                                                    |
| ------------------------------------------------- | ---------------------------------------------- | ------------------------------------------------------------------------- |
| Services, key hashes, audit history, request logs | Selected platform database                     | Remain if the same database location/volume is used.                      |
| Admin sessions                                    | Selected platform database plus browser cookie | Can remain valid until their expiry; server authentication checks expiry. |
| Raw newly created key shown in the UI             | Browser memory                                 | Lost on browser reload unless the user copied it elsewhere.               |
| Local rate-limit timestamps                       | Gateway memory                                 | Cleared when the gateway restarts.                                        |
| Redis rate-limit timestamps                       | Redis                                          | Short-lived; durable recovery is not configured by this project.          |
| Fake Users and Products records                   | Each sample service's memory                   | Reset to the initial examples when that service restarts.                 |

Creating missing tables at startup is not a schema-migration system. If a future feature adds or changes a column in an existing database, it needs an explicit migration; editing `CREATE TABLE IF NOT EXISTS` alone will not update the existing table.

## 12. The sample services

The gateway needs real backends to demonstrate forwarding. [services/sample-app.mjs](services/sample-app.mjs) contains one shared Express implementation. The Users and Products entry files call it with different names, starting records, and ports.

`createSampleApp()` builds the Express application without opening a port. `runSampleService()` starts it listening. Keeping these separate lets tests start their own temporary service instances.

| Endpoint pattern                       | Behavior                                                                               |
| -------------------------------------- | -------------------------------------------------------------------------------------- |
| `GET /health`                          | Report that this sample service is running.                                            |
| `GET /users` or `/products`            | Return the current records; optional `?q=...` searches names without case sensitivity. |
| `GET /users/:id` or `/products/:id`    | Return one numeric-ID record, or 404.                                                  |
| `POST /users` or `/products`           | Validate a name, allocate the next ID, append a record, and return 201.                |
| `DELETE /users/:id` or `/products/:id` | Remove an existing record, or return 404.                                              |

Users have `id`, `name`, and `role`. Products have `id`, `name`, and `category`. New names must be nonblank and at most 100 characters. A missing role/category becomes `Demo`. The initial examples include Asha and Rohan for Users, and Notebook and Desk lamp for Products.

The samples do not implement PUT or PATCH, even though the gateway can forward those methods to other backends. They do not authenticate keys themselves. Local direct calls to ports 4001 and 4002 therefore bypass the gateway's checks. The protected demonstration uses port 4000, and Docker keeps the sample service ports inside its network.

## 13. The complete file structure

This is the authored project structure. Generated dependencies, build output, and local data are explained separately below it.

```text
centralized API Platform/
|-- apps/
|   |-- dashboard/
|   |   |-- app/
|   |   |   |-- api/
|   |   |   |   |-- platform/[...path]/route.js
|   |   |   |   `-- gateway/[action]/route.js
|   |   |   |-- layout.js
|   |   |   |-- page.js
|   |   |   `-- globals.css
|   |   |-- next.config.mjs
|   |   |-- postcss.config.mjs
|   |   `-- AGENTS.md
|   `-- gateway/
|       |-- server.mjs
|       |-- app.mjs
|       |-- store.mjs
|       |-- security.mjs
|       |-- limiter.mjs
|       `-- health.mjs
|-- services/
|   |-- sample-app.mjs
|   |-- users/server.mjs
|   `-- products/server.mjs
|-- scripts/
|   |-- dev.mjs
|   |-- demo-check.mjs
|   `-- load-test.js
|-- tests/
|   `-- platform.test.mjs
|-- package.json
|-- package-lock.json
|-- .env.example
|-- .gitignore
|-- .dockerignore
|-- .prettierrc.json
|-- .prettierignore
|-- Dockerfile
|-- compose.yaml
|-- README.md
|-- PROJECT_GUIDE.md
|-- IMPLEMENTATION.md
|-- VERIFICATION.md
|-- plan.md
|-- phase-1-documentation.md
|-- SPM.pdf
|-- phase-1-preview.jpg
`-- project-preview.jpg
```

### Dashboard files

| File                                                                                          | What it serves and how it connects                                                                                                                     |
| --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| [app/layout.js](apps/dashboard/app/layout.js)                                                 | The outer HTML/body wrapper for the dashboard. Imports global CSS and sets page metadata.                                                              |
| [app/page.js](apps/dashboard/app/page.js)                                                     | The interactive dashboard, sign-in form, screen state, forms, tables, playground, and API helpers. Calls the Next.js bridge.                           |
| [app/globals.css](apps/dashboard/app/globals.css)                                             | Tailwind import and the project's custom visual styling, including responsive layouts.                                                                 |
| [app/api/platform/[...path]/route.js](apps/dashboard/app/api/platform/%5B...path%5D/route.js) | Main server-side bridge to gateway admin, proxy, and health endpoints. Forwards selected headers and responses.                                        |
| [app/api/gateway/[action]/route.js](apps/dashboard/app/api/gateway/%5Baction%5D/route.js)     | Earlier health-only bridge retained from Phase 1.                                                                                                      |
| [next.config.mjs](apps/dashboard/next.config.mjs)                                             | Next.js configuration, including disabling the development indicator and routine incoming-request logging. This does not disable gateway traffic logs. |
| [postcss.config.mjs](apps/dashboard/postcss.config.mjs)                                       | Registers the Tailwind PostCSS plugin used when compiling CSS.                                                                                         |
| [AGENTS.md](apps/dashboard/AGENTS.md)                                                         | Guidance for coding assistants working in this folder. It is not loaded by the application at runtime.                                                 |

### Gateway files

| File                                      | What it serves and how it connects                                                                                                                                                                       |
| ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [server.mjs](apps/gateway/server.mjs)     | The executable entry point. Builds the gateway, opens its port, handles startup errors, and closes it on shutdown signals.                                                                               |
| [app.mjs](apps/gateway/app.mjs)           | The main behavior: validation schemas, session guards, all gateway endpoints, service/key management, proxy flow, traffic logs, audit events, and analytics queries. Uses all four helper modules below. |
| [store.mjs](apps/gateway/store.mjs)       | SQL table definitions, database adapter selection, transactions, persistence, and one-time demo seeding.                                                                                                 |
| [security.mjs](apps/gateway/security.mjs) | `hash()`, `secret()`, `passwordVerifier()`, session-cookie parsing, and cookie construction. Has no HTTP routes of its own.                                                                              |
| [limiter.mjs](apps/gateway/limiter.mjs)   | Memory and Redis implementations with a common `consume()`/`ping()`/`close()` interface. Contains the atomic Redis Lua script.                                                                           |
| [health.mjs](apps/gateway/health.mjs)     | Checks configured sample services, database, and limiter; reports component status and measured latency.                                                                                                 |

### Sample services, scripts, and tests

| File                                                         | What it serves and how it connects                                                                                  |
| ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------- |
| [services/sample-app.mjs](services/sample-app.mjs)           | Shared Express routes, input checks, in-memory records, and server-start helper.                                    |
| [services/users/server.mjs](services/users/server.mjs)       | Supplies Users fixtures and its configured port to the shared sample-service helper.                                |
| [services/products/server.mjs](services/products/server.mjs) | Supplies Products fixtures and its configured port to the same helper.                                              |
| [scripts/dev.mjs](scripts/dev.mjs)                           | Launches and stops the four local processes and gives them matching URLs and ports.                                 |
| [scripts/demo-check.mjs](scripts/demo-check.mjs)             | Calls a running dashboard bridge to verify login, keys, routing, limiting, recovery, logs, and revocation together. |
| [scripts/load-test.js](scripts/load-test.js)                 | k6 setup, ten concurrent requests, exact-count assertions, and key/session cleanup. Runs in k6, not with `node`.    |
| [tests/platform.test.mjs](tests/platform.test.mjs)           | Automated integration, limiter-boundary, and persistence tests using isolated stores and temporary sample servers.  |

### Root configuration and documentation

| File                                                 | What it serves                                                                                                                      |
| ---------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| [package.json](package.json)                         | Project metadata, Node version requirement, dependencies, and commands. One root package manages both applications and the samples. |
| [package-lock.json](package-lock.json)               | Exact installed dependency tree for repeatable `npm ci` installations.                                                              |
| [.env.example](.env.example)                         | Copyable local configuration defaults. The app does not load this example file directly.                                            |
| [.gitignore](.gitignore)                             | Excludes dependencies, local `.env`, database files, generated output, and temporary artifacts from Git.                            |
| [.dockerignore](.dockerignore)                       | Excludes local secrets, data, dependencies, screenshots, PDFs, and generated files from Docker's build context.                     |
| [.prettierrc.json](.prettierrc.json)                 | Formatting preferences: single quotes, 110-character target width, and trailing commas.                                             |
| [.prettierignore](.prettierignore)                   | Prevents formatting generated files, local data, and the lockfile.                                                                  |
| [Dockerfile](Dockerfile)                             | Builds a shared Node runtime image and a second target with a compiled dashboard. Runs as the `node` user.                          |
| [compose.yaml](compose.yaml)                         | Connects the applications, PostgreSQL, Redis, volumes, ports, health checks, and optional test containers.                          |
| [README.md](README.md)                               | First place to find setup, commands, demo access, and common issues.                                                                |
| [PROJECT_GUIDE.md](PROJECT_GUIDE.md)                 | This complete walkthrough, file map, reference, and enhancement discussion.                                                         |
| [IMPLEMENTATION.md](IMPLEMENTATION.md)               | Shorter overview of the completed project and its logic.                                                                            |
| [VERIFICATION.md](VERIFICATION.md)                   | Recorded checks, repeatable verification commands, and verification limits.                                                         |
| [plan.md](plan.md)                                   | Original six-phase development plan.                                                                                                |
| [phase-1-documentation.md](phase-1-documentation.md) | Historical explanation of the foundation at Phase 1; it is not the full current specification.                                      |
| [SPM.pdf](SPM.pdf)                                   | Original project presentation.                                                                                                      |
| [phase-1-preview.jpg](phase-1-preview.jpg)           | Saved image of the earlier prototype.                                                                                               |
| [project-preview.jpg](project-preview.jpg)           | Saved image of the completed dashboard. Screenshots are evidence, not live application state.                                       |

### Generated or optional local folders

| Location                | Why it may exist                                                                           |
| ----------------------- | ------------------------------------------------------------------------------------------ |
| `node_modules/`         | Packages installed by npm. Change dependency declarations, not these generated files.      |
| `apps/dashboard/.next/` | Next.js development/build output. Recreated by Next.js.                                    |
| `data/platform/`        | Default persistent PGlite database. This is application data, not disposable build output. |
| `.env`                  | Optional local settings copied from `.env.example`; ignored by Git.                        |
| `.npm-cache/`           | Local package-download cache used during setup where configured.                           |
| `.artifacts/`           | Temporary development/verification tools or artifacts; not required source code.           |
| `.git/`                 | Git repository history and metadata.                                                       |

There is no separate Python backend, ORM model directory, generated API client, or microservice database layer to find. The important logic is concentrated in the JavaScript files above.

## 14. Endpoint reference

These paths are relative to the gateway, normally `http://127.0.0.1:4000`. Browser requests add `/api/platform` before the same path on the dashboard origin.

JSON writes use `Content-Type: application/json`. `:id` means replace that part with the actual saved record ID.

### Public and session endpoints

| Method and path      | Authentication      | Input                  | Result                                                            |
| -------------------- | ------------------- | ---------------------- | ----------------------------------------------------------------- |
| `GET /health`        | None                | None                   | Gateway process status and timestamp.                             |
| `GET /system/health` | None                | None                   | Component states and database/limiter modes; 200 or degraded 503. |
| `POST /admin/login`  | Credentials in body | `username`, `password` | Username and session cookie on success.                           |
| `GET /admin/me`      | Admin cookie        | None                   | Current configured admin username.                                |
| `POST /admin/logout` | Admin cookie        | None                   | `{ "ok": true }` and a cleared session cookie.                    |

### Service and key management

All endpoints in this table require a valid admin cookie.

| Method and path               | Input                                            | Result                                                       |
| ----------------------------- | ------------------------------------------------ | ------------------------------------------------------------ |
| `GET /admin/services`         | None                                             | `{ "services": [...] }`                                      |
| `POST /admin/services`        | `name`, `prefix`, `base_url`; optional `enabled` | Created service row, status 201.                             |
| `PUT /admin/services/:id`     | `name`, `prefix`, `base_url`, `enabled`          | Updated service row.                                         |
| `DELETE /admin/services/:id`  | None                                             | `{ "ok": true }`, or 404 if absent.                          |
| `GET /admin/keys`             | None                                             | `{ "keys": [...] }` with public metadata only.               |
| `POST /admin/keys`            | `name`, `rate_limit`, `window_seconds`           | Created metadata plus one-time `key`, status 201.            |
| `PATCH /admin/keys/:id`       | `rate_limit`, `window_seconds`                   | Updated active-key metadata.                                 |
| `POST /admin/keys/:id/revoke` | None                                             | Revoked-key metadata. Already revoked or absent returns 404. |

Public key metadata means `id`, `name`, `hint`, `rate_limit`, `window_seconds`, `revoked`, and `created_at`. The word “public” here describes fields that can be displayed to the administrator; the listing itself still requires admin authentication.

### Logs, audit, and analytics

These endpoints also require an admin cookie.

| Method and path        | Query parameters                                                  | Result                                                                                      |
| ---------------------- | ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `GET /admin/logs`      | Optional `status`, `client`, `service`, `path`, `limit`, `offset` | `{ "logs": [...], "total": ..., "limit": ..., "offset": ... }`                              |
| `GET /admin/audit`     | Optional `offset`                                                 | Same pagination shape; page size is fixed at 20.                                            |
| `GET /admin/analytics` | None                                                              | `total`, `successful`, `blocked`, `failed`, `average_ms`, grouped `services`, and `period`. |

`client` and `service` filters take IDs, not display names. Status is an integer from 100 to 599; log page size is 1–100, default 20. Offsets can be 0–1,000,000. Path filtering accepts up to 100 characters.

For example, `/admin/logs?status=429&client=CLIENT_ID&limit=20&offset=0` reads the first page of rate-limited requests for a particular key. Its `total` is the number matching those filters, not just the number returned on this page.

### Client proxy

The gateway registers GET, POST, PUT, PATCH, DELETE, and HEAD on `/proxy` and `/proxy/*`. Every proxy call needs `X-API-Key`. Supporting a method at the gateway does not guarantee the destination backend implements it.

| Client request                | Forwarded request with default registrations            |
| ----------------------------- | ------------------------------------------------------- |
| `GET /proxy/users`            | `GET http://127.0.0.1:4001/users`                       |
| `GET /proxy/users/1`          | `GET http://127.0.0.1:4001/users/1`                     |
| `GET /proxy/products?q=book`  | `GET http://127.0.0.1:4002/products?q=book`             |
| `POST /proxy/users` plus JSON | `POST http://127.0.0.1:4001/users` with serialized JSON |
| `DELETE /proxy/products/2`    | `DELETE http://127.0.0.1:4002/products/2`               |

There is no custom OPTIONS/preflight route or general cross-origin client configuration. The dashboard avoids that problem by using its same-origin bridge. Command-line clients can call the gateway directly.

## 15. Configuration and commands

### Basic local configuration

To customize the defaults, copy the example once:

```powershell
Copy-Item .env.example .env
```

Edit `.env` and restart the application. Do not overwrite an existing customized `.env` just to follow this example.

| Variable          | Default or example value                                                      | Meaning                                                                                      |
| ----------------- | ----------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `ADMIN_USER`      | `admin`                                                                       | The single admin username.                                                                   |
| `ADMIN_PASSWORD`  | `local-demo-123`                                                              | The admin password used at gateway startup.                                                  |
| `DB_MODE`         | `embedded`                                                                    | Select `embedded` or `postgres`.                                                             |
| `RATE_LIMIT_MODE` | `memory`                                                                      | Select `memory` or `redis`.                                                                  |
| `DATA_DIR`        | `data/platform`                                                               | Embedded database location, relative to the local project working directory unless absolute. |
| `DASHBOARD_PORT`  | `3000`                                                                        | Dashboard port used by the local launcher.                                                   |
| `GATEWAY_PORT`    | `4000`                                                                        | Local gateway port.                                                                          |
| `USERS_PORT`      | `4001`                                                                        | Local Users service port.                                                                    |
| `PRODUCTS_PORT`   | `4002`                                                                        | Local Products service port.                                                                 |
| `DATABASE_URL`    | `postgresql://platform:platform_local@127.0.0.1:5432/platform` in the example | Connection string used in PostgreSQL mode.                                                   |
| `REDIS_URL`       | `redis://127.0.0.1:6379` in the example                                       | Connection address used in Redis mode.                                                       |

The two mode switches are independent in code. The documented full stack uses PostgreSQL and Redis together. The default demo uses embedded storage and memory limiting together.

### Additional settings used by the code

| Variable                    | Purpose and behavior                                                                                                                                                                          |
| --------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `HOST`                      | Gateway/sample listening address; defaults to `127.0.0.1`. Compose sets it to `0.0.0.0` inside containers.                                                                                    |
| `GATEWAY_URL`               | Address used by the Next.js bridge. The local launcher constructs it from `GATEWAY_PORT`; Compose uses `http://gateway:4000`.                                                                 |
| `USERS_URL`, `PRODUCTS_URL` | Initial registrations and sample-health destinations. The local launcher derives them from sample ports; Compose uses service names.                                                          |
| `DASHBOARD_ORIGINS`         | Comma-separated allowed browser origins for admin writes. Local startup includes localhost and 127.0.0.1 with the chosen dashboard port. Use complete origins without spaces between entries. |
| `COOKIE_SECURE`             | Set to exactly `true` to add the Secure cookie attribute for an HTTPS setup. It is not needed for the default HTTP demo.                                                                      |
| `DEMO_BASE_URL`             | Override the demo-check target; defaults to the local dashboard's `/api/platform` address.                                                                                                    |
| `TEST_DATABASE_URL`         | Tell integration tests to create a temporary schema in an external PostgreSQL database.                                                                                                       |
| `TEST_REDIS_URL`            | Tell integration tests to exercise Redis instead of the memory limiter.                                                                                                                       |
| `NEXT_TELEMETRY_DISABLED`   | Set to `1` by the local launcher and Dockerfile.                                                                                                                                              |

These variables are not all listed in `.env.example`, and Compose only passes variables explicitly declared in its configuration. Adding a value to `.env` does not automatically inject it into every container.

The five-second gateway-to-backend timeout is currently a code configuration default in `app.mjs`; there is no documented `.env` variable for changing it. Tests can override it through `buildGateway({ config: ... })`.

### Command reference

| Command               | What it actually does                                                                                             |
| --------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `npm ci`              | Install dependencies from the lockfile.                                                                           |
| `npm start`           | Run the four local processes in development mode, loading optional `.env`.                                        |
| `npm run dev`         | Same local launcher as `npm start`.                                                                               |
| `npm run build`       | Build the dashboard using webpack. Does not launch the platform.                                                  |
| `npm test`            | Run the Node test files. Does not require the regular demo to be running.                                         |
| `npm run demo:check`  | Check the already-running platform through the dashboard bridge.                                                  |
| `npm run db:up`       | Start just PostgreSQL and Redis using Compose and wait for health checks.                                         |
| `npm run db:down`     | Stop those two database containers without deleting their data volume.                                            |
| `npm run docker:up`   | Build and start the full Compose application and wait for health checks.                                          |
| `npm run docker:down` | Stop/remove the Compose containers and network; retain named volumes.                                             |
| `npm run test:docker` | Run isolated tests using real PostgreSQL and Redis in the optional checks container.                              |
| `npm run test:load`   | Run the optional k6 container against the Docker gateway.                                                         |
| `npm run format`      | Format the source/configuration and the documentation files explicitly named in `package.json`. It is not a test. |

The formatting script does not currently include every Markdown file. To format this guide specifically using the installed formatter, run `npx --no-install prettier --write PROJECT_GUIDE.md`.

Next.js reloads dashboard changes during local development. The launcher does not watch gateway or sample-service source files; restart the local process group after changing those files.

### Running local applications with external databases

If Docker is available but you want to keep the Node applications local:

1. Set `DB_MODE=postgres` and `RATE_LIMIT_MODE=redis` in `.env`.
2. Keep the example database connection URLs that use `127.0.0.1`.
3. Run `npm run db:up`.
4. Run `npm start`.

The gateway now uses external PostgreSQL and Redis while the dashboard and samples remain local. This is different from putting every component in a container. Switching the same external database between local and container applications may require editing saved backend origins, because those addresses are meaningful from the gateway's location.

## 16. The Docker version

The Docker version expresses the presentation's full PostgreSQL/Redis setup. It is optional for demonstrating the tested local application.

### Images and containers

The Dockerfile has two build targets:

- `runtime` starts from Node 24, installs the locked dependencies, copies source and tests, and runs as the `node` user. Its default command starts the gateway. Compose overrides that command for sample services and tests.
- `dashboard` extends that target, builds the Next.js application, sets production mode, and starts the compiled dashboard.

Compose defines six main components:

| Component   | What it runs                       | Address used inside Compose                                           |
| ----------- | ---------------------------------- | --------------------------------------------------------------------- |
| `dashboard` | Built Next.js interface and bridge | Port 3000; bridge calls `gateway:4000`.                               |
| `gateway`   | Fastify application                | Port 4000; connects to services and databases by their Compose names. |
| `users`     | Users sample                       | `http://users:4001`                                                   |
| `products`  | Products sample                    | `http://products:4002`                                                |
| `postgres`  | PostgreSQL 17                      | `postgres:5432`                                                       |
| `redis`     | Redis 8                            | `redis:6379`                                                          |

There are also two optional components in the `tools` profile: `checks` and `load-test`. They run verification tasks and are not part of normal startup.

Inside a container, `127.0.0.1` refers to that container itself. This is why the container gateway uses `users` and `products`, rather than the host's loopback addresses, for its backends.

### Startup, ports, and saved data

Start it with:

```sh
npm run docker:up
```

Alternatively, without using host npm:

```sh
docker compose up --build -d --wait
```

The gateway waits for healthy PostgreSQL and Redis and started sample containers. Its own dependency health check then confirms the samples can respond. The dashboard waits for the gateway's health check.

Dashboard port 3000, gateway port 4000, PostgreSQL port 5432, and Redis port 6379 are published on the host's loopback interface. Users and Products have no published host ports. Stop a local demo using the same ports before starting the full Docker stack.

PostgreSQL uses the `postgres_data` named volume. `npm run docker:down` retains it. Redis has no persistent volume in this configuration, and sample data remains in memory.

Compose port bindings are written explicitly in `compose.yaml`; changing local port variables in `.env` does not rewrite those bindings. The Compose admin credentials use the configured environment values when supplied, otherwise the demo defaults.

**Verification status:** Compose syntax, dependency references, and sample-port isolation were checked. Containers, real PostgreSQL, and real Redis have not been exercised on this machine because Docker/WSL was unavailable. Use the commands in the next section to complete that verification on a suitable machine.

## 17. Tests and verification

Testing follows the same story as the application: test individual decisions, test the assembled gateway, and then test a running deployment through its actual HTTP entry points.

### Automated integration and persistence tests

Run:

```sh
npm test
```

[platform.test.mjs](tests/platform.test.mjs) uses Node's test runner and assertions. It starts temporary sample HTTP services and assembles a gateway with an isolated database and limiter. Most gateway calls use Fastify's `inject()` helper, which runs the request through Fastify without requiring an external HTTP client. There is also a real HTTP health call, and forwarding to the samples uses real HTTP.

The suite covers:

- Health and truthful runtime-mode reporting.
- Admin authentication, origin rejection, logout, and session expiry.
- Service seeding, registration validation, duplicate prefixes, disabling, longest-prefix matching, and deletion.
- One-time key issuance, stored hashes, missing/invalid/revoked keys, and policy validation.
- GET path/query forwarding and POST body/status forwarding.
- Unknown routes, encoded invalid paths, and unreachable backends.
- Concurrent requests: with a five-request allowance, twelve simultaneous calls yield five successes and seven 429 responses.
- Window recovery and independent allowances for separate keys.
- Filtered logs, pagination, audit evidence, analytics, and omission of raw secrets/query strings from recorded history.
- An exact sliding-window boundary using supplied timestamps instead of waiting.
- Embedded persistence: close and reopen a temporary database, then confirm saved settings, revocation, logs, and seed behavior remain correct.

The recorded run reported **15 passing tests**, including the parent integration test and its subtests. The tests use memory or temporary database locations; they do not clear the normal `data/platform` database.

When `TEST_DATABASE_URL` is supplied, the integration fixture creates a unique PostgreSQL schema, uses it for the test, and removes it afterward. When `TEST_REDIS_URL` is supplied, it uses the Redis limiter. The separate embedded persistence test still checks PGlite.

### Full running-demo check

With the normal platform running in another terminal:

```sh
npm run demo:check
```

This script logs in through the Next.js bridge, creates a key allowing five requests in two seconds, and sends ten concurrent calls. It expects five successes and five rate limits, waits for recovery, checks missing/revoked keys and an unknown route, and verifies filtered logs.

It revokes its key and logs out, including cleanup attempts if the check fails partway through. The revoked key record and its request/audit history remain as visible demo evidence. This check expects the saved `/users` registration to be enabled and reachable.

### Small k6 load test

With k6 installed locally and the gateway running:

```sh
k6 run --no-usage-report scripts/load-test.js
```

The script logs in directly to the gateway, creates a fresh key with a five-request allowance in sixty seconds, and sends ten requests using ten virtual users. It asserts exactly five allowed and five limited responses, then revokes the key and logs out.

This verifies concurrent policy behavior. Ten requests are not evidence of production capacity or a large-scale performance benchmark. The script runs locally; it does not use a cloud load-testing service.

k6 reads its overrides from process environment variables such as `GATEWAY_URL`, `ADMIN_USER`, and `ADMIN_PASSWORD`. Unlike `npm run demo:check`, this direct k6 command does not automatically load the project's `.env` file.

### Build and container checks

```sh
npm run build
```

The dashboard production build was checked successfully. It checks that the dashboard compiles; it does not replace runtime behavior tests.

On a Docker-equipped machine:

```sh
npm run docker:up
npm run test:docker
npm run test:load
```

The Docker integration check uses the temporary schema described above. It does not reset the regular demo tables. The Docker load test deliberately creates demo traffic and a revoked key in the running platform.

### What has actually been verified

The previous implementation verification, recorded across 31 October and 1 November 2026 in [VERIFICATION.md](VERIFICATION.md), includes passing local automated tests, dashboard build, full HTTP demo check, browser workflow, and local k6 check. A dependency audit at that time reported no known vulnerabilities; that is a dated result, not a permanent guarantee.

The browser workflow was checked manually. There is no automated browser test suite yet. Real Docker/PostgreSQL/Redis runtime checks remain outstanding. This documentation update does not claim to have rerun those implementation checks.

## 18. Troubleshooting by following the request

When something fails, start at the first layer the request should reach and follow the same path described earlier.

| Symptom                                                  | What to check and why                                                                                                                                                  |
| -------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Dashboard will not open                                  | Check the launcher terminal and port 3000. A child process failure can stop the whole local group.                                                                     |
| “Gateway unavailable” in the UI                          | Check that the gateway initialized successfully and that the bridge's gateway address matches its port. The bridge returns 502 if it cannot complete the gateway call. |
| Sign-in rejected                                         | Check `.env` credentials and restart after changing them. Repeated attempts can trigger the separate 10-per-minute login limit.                                        |
| Admin write returns 403                                  | Check the browser origin against `DASHBOARD_ORIGINS`, including protocol and port.                                                                                     |
| Admin endpoint returns 401                               | The session is missing, expired, or logged out. Sign in again.                                                                                                         |
| Playground returns 401                                   | Supply a current API key. Dashboard login does not authorize client traffic.                                                                                           |
| Playground returns 429                                   | Wait for the oldest accepted calls to leave the window, or edit the policy. Calls to other services with the same key share the allowance.                             |
| A route returns 404                                      | Check that the registration is enabled and that both its prefix and the backend's actual endpoint match the requested path. A backend can also return its own 404.     |
| A route returns 502                                      | Check the backend process and origin from the gateway's point of view. A redirect or oversized backend response can also cause 502.                                    |
| A route returns 504                                      | The backend exceeded the gateway's upstream timeout.                                                                                                                   |
| Health returns 503                                       | Read the component entries to find the failed database, limiter, or configured sample service.                                                                         |
| Newly issued key disappeared after reload                | The full key was only in browser memory. Issue another and revoke the lost one.                                                                                        |
| Service port changed but routing still uses the old port | Seeding runs once. Edit the saved registration's `base_url`.                                                                                                           |
| Data differs between local and Docker mode               | They use separate databases. There is no automatic import between them.                                                                                                |
| A new sample record vanished                             | Sample arrays reset on service restart. Gateway settings/logs use a different persistent store.                                                                        |
| No service is shown for a blocked log                    | Access checks run before routing, so no service may have been selected.                                                                                                |
| Log duration differs from playground duration            | They measure different spans; the browser includes the bridge and round trip.                                                                                          |
| A test burst does not show five successes                | Use a fresh five-request key or wait for previous calls to expire. Also ensure `/users` is enabled and healthy.                                                        |

For a persistence issue, check which database mode and location the gateway is actually using before considering any reset. A reset would remove useful registrations and history; it is not a routine troubleshooting requirement.

## 19. Current boundaries and future improvements

The academic scope is implemented: one administrator can register services, issue keys, enforce limits, send requests, and inspect saved results. Improvements below are **future work**, not features already present.

### Current boundaries

| Area                 | Current behavior                                                                                               |
| -------------------- | -------------------------------------------------------------------------------------------------------------- |
| Administration       | One configured administrator; no account registration, role hierarchy, or multi-organization model.            |
| Client access        | Keys authorize all enabled services; no expiry or service-specific scope.                                      |
| Routing              | Prefix matching with no prefix rewrite, backend deployment, or load balancing.                                 |
| Payloads             | Small JSON-oriented requests; no upload, streaming, or WebSocket workflow.                                     |
| Headers              | Selected forwarding only, rather than a transparent pass-through of every header.                              |
| Monitoring           | All-time summaries, paged tables, and manually refreshed health; no live stream or scheduled alerts.           |
| Data lifecycle       | No automatic log retention, export/import screen, or schema-migration framework.                               |
| Sample business data | Fake arrays that reset on restart.                                                                             |
| Scaling              | One gateway in the local demonstration; memory limits are not shared across processes.                         |
| Deployment           | Local academic use. Public HTTPS deployment, network hardening, and production operations are not implemented. |

The current protections include session checks, hashed keys/tokens, bounded input, parameterized SQL, origin checks, request limits, and careful logging. They do not make this a production security product. For example, a trusted admin can register a backend origin reachable by the gateway; there is no network destination allowlist or full protection against an untrusted admin directing it to internal addresses.

### A practical improvement order

Each step can be developed and demonstrated locally using free tools. A paid hosting service, subscription, domain, or external AI API is not required for any of these changes.

| Order | Improvement                                        | Why it helps                                                                                                                   | Likely files or areas                                                        |
| ----- | -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------- |
| 1     | Run the full PostgreSQL/Redis/Docker checks        | Confirms the supplied external mode behaves like the tested embedded mode.                                                     | `compose.yaml`, existing tests, `VERIFICATION.md`                            |
| 2     | Add targeted failure tests and browser automation  | Checks slow backends, oversized responses, Redis outages, and complete form interactions automatically.                        | `tests/`, a future browser-test folder                                       |
| 3     | Split large UI and gateway files by responsibility | Makes changes easier to read without changing user-visible behavior.                                                           | Extract dashboard screens/hooks from `page.js`; route modules from `app.mjs` |
| 4     | Add versioned database migrations                  | Lets existing databases safely receive new columns and constraints.                                                            | `store.mjs`, future `migrations/` directory                                  |
| 5     | Add log date filters, retention, and CSV export    | Keeps history useful and prevents endless growth. Export should preserve the current secret-omission rules.                    | Log SQL and endpoints in `app.mjs`, dashboard log screen                     |
| 6     | Add key expiry and per-service permissions         | Allows a client to access only selected services for a chosen time.                                                            | Schema, key forms, admin endpoints, proxy validation, tests                  |
| 7     | Add multiple admins and session management         | Makes actor names meaningful across several users and allows session revocation after password changes.                        | New account/session fields, authentication, dashboard controls               |
| 8     | Check health for every registered service          | Makes monitoring follow the registry instead of two fixed sample URLs.                                                         | `health.mjs`, service settings, Overview                                     |
| 9     | Add request IDs and time-based analytics           | Connects one request across layers and reveals changes over time. Stable service-ID grouping would avoid name-split summaries. | Proxy/log schema, bridge headers, analytics, UI                              |
| 10    | Persist sample records if the demo needs it        | Allows a created sample user/product to survive a restart. Keep this data separate from gateway configuration.                 | Sample service storage and tests                                             |

After those changes, larger optional work could include route rewriting, allowed-method policies, backend pools, or several gateways sharing Redis. Those features each need explicit behavior and tests. For example, caching registrations might reduce database reads, but would also require a reliable way to invalidate the cache after an admin edit so changes remain immediate.

For any future public deployment, HTTPS, restricted backend destinations, private service networking, proper credential management, backups, and more failure testing would need a separate design. None of that is necessary to demonstrate the current project locally.

### Example: how key expiry would connect through the code

Suppose the next requirement is “a key should stop working after a selected date.” That feature would cross several existing layers:

1. Add an `expires_at` column through a migration, with a clear rule for old keys.
2. Add the expiry field to key creation/edit validation and safe list responses.
3. Add a date input and expiry label to the dashboard's key screen.
4. Make the proxy check expiry after identifying the key and before consuming allowance.
5. Record expiry changes in the audit trail without including the raw key.
6. Add tests for valid, expired, and boundary-time keys.
7. Update the guide and demo instructions.

This illustrates the existing structure: the UI collects intent, the API validates it, the database remembers it, the proxy enforces it, and tests demonstrate that the pieces agree.

## 20. How to read and extend the code

Reading every line from top to bottom is not required to understand the project. Follow a small use case across files.

### Suggested reading order

1. Read `package.json` to see the commands and dependencies.
2. Read `scripts/dev.mjs` to see which processes exist and how their addresses connect.
3. Read `apps/gateway/server.mjs`, then the beginning of `buildGateway()` in `app.mjs`, to see startup.
4. Read `store.mjs` to understand what is saved and how the initial state appears.
5. Read `security.mjs` and the login/admin guard code to understand administrator access.
6. Read the service and key endpoints, then the `proxy()` function, to understand configuration becoming behavior.
7. Read `limiter.mjs` and the logging hook to understand limits and evidence.
8. Read the Next.js bridge and the helpers at the start of `page.js` to connect backend behavior to the interface.
9. Read `sample-app.mjs` to see what happens after forwarding.
10. Read the tests to see concrete inputs and expected results.

### Where to start for common changes

| Desired change                           | First place to look             | Follow through to                                                                    |
| ---------------------------------------- | ------------------------------- | ------------------------------------------------------------------------------------ |
| Change layout, labels, or screen content | `page.js`, `globals.css`        | Browser check; no database change needed for wording alone.                          |
| Add a service-registration field         | Schemas and routes in `app.mjs` | Database migration, form state, saved-list display, tests.                           |
| Change routing behavior                  | `proxy()` in `app.mjs`          | Sample/custom backend compatibility and integration tests.                           |
| Change the rate-limit algorithm          | `limiter.mjs`                   | Both memory and Redis implementations, response headers, boundary/concurrency tests. |
| Add a traffic metric                     | Analytics SQL in `app.mjs`      | Decide whether existing logs contain the needed data; then update UI and tests.      |
| Add a new sample API                     | `services/`                     | Launcher, registry seed or manual registration, Compose if used, and tests.          |
| Change authentication                    | `security.mjs` and admin routes | Session storage, cookie behavior, bridge behavior, UI, and tests.                    |

Two design choices make testing easier: `buildGateway()` can accept a store, limiter, and configuration, and `createSampleApp()` can build a service without immediately binding a fixed port. Tests can therefore use isolated resources while exercising the same application logic.

When adding behavior, first describe one visible outcome, implement the path needed for it, and check that outcome. Keep the story consistent across the form, API validation, saved data, enforcement, and documentation.

## 21. A connected demonstration

The following sequence presents the project as one story rather than unrelated screens:

1. **Start the platform.** Open Overview and show the gateway, two services, database, and limiter. Explain which runtime mode is active.
2. **Show the registry.** Open Services and point out that `/users` and `/products` lead to different backend origins through one gateway.
3. **Issue access.** Create a fresh key named `Presentation client` with five requests in sixty seconds. Explain the one-time key display and stored hash.
4. **Demonstrate the policy.** Before making any other calls with that key, run the ten-GET burst against `/users`. With the service healthy, five calls succeed and five receive 429.
5. **Explain the evidence.** Open Request logs, filter to that client, and compare the successes and blocked calls. Show that rate-limited calls have no matched service because the limiter stopped them first.
6. **Show recovery and normal data.** Wait for the window to expire, then make one GET. Create a sample user with POST and use its returned ID to fetch it. Wait again if earlier calls use the allowance.
7. **Demonstrate routing control.** Disable the Users registration and call `/users` with available allowance to show 404. Re-enable it and show that it works again without restarting the gateway.
8. **Withdraw access.** Revoke the key and repeat a request to show 401. Revocation is checked before the rate limiter.
9. **Connect changes to history.** Open Audit trail to show key creation, registration changes, and revocation. Open Overview to show totals derived from the saved request rows.
10. **Explain persistence.** State that configuration, key hashes, and logs remain in the selected database, while the sample records and local limiter are intentionally temporary.

This demonstrates the full chain: configure a destination, issue access, apply a policy, forward an allowed request, reject a disallowed one, and explain both outcomes using saved evidence.

## 22. Small glossary

| Term                 | Simple meaning in this project                                                                                                           |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| API                  | Addresses and rules that programs use to communicate.                                                                                    |
| Endpoint             | One address and HTTP method, such as `GET /admin/services`.                                                                              |
| HTTP method          | The requested operation: GET reads, POST creates/submits, PUT replaces configured fields, PATCH changes selected fields, DELETE removes. |
| Gateway              | The central server that checks and forwards client requests.                                                                             |
| Proxy                | The forwarding behavior of the gateway.                                                                                                  |
| Backend/upstream     | The service that receives a forwarded request.                                                                                           |
| Origin               | Protocol, hostname, and optional port, such as `http://127.0.0.1:4001`.                                                                  |
| Prefix               | The beginning of a path used to select a registered service.                                                                             |
| Bridge               | The Next.js server route that forwards browser calls to the gateway.                                                                     |
| Header               | Extra request/response information, such as `X-API-Key` or `Retry-After`.                                                                |
| JSON                 | Text format used for request and response data, with objects, arrays, and values.                                                        |
| Session              | A temporary signed-in identity recognized by a token and expiry.                                                                         |
| Cookie               | Browser-managed information sent with matching requests.                                                                                 |
| Hash                 | A one-way fingerprint used to recognize a secret without storing its original value.                                                     |
| Rate limit           | A maximum number of requests allowed within a time window.                                                                               |
| Sliding window       | A time window that moves forward with each request.                                                                                      |
| Atomic               | Several steps executed as one indivisible operation.                                                                                     |
| Transaction          | Database changes that commit together or roll back together.                                                                             |
| Schema               | The table/field structure; in PostgreSQL tests, also a named namespace isolating test tables.                                            |
| Migration            | An explicit, repeatable change to an existing database structure.                                                                        |
| Seed                 | Initial example/configuration data inserted into a new database.                                                                         |
| Persistence          | Data surviving after the process that created it stops.                                                                                  |
| Audit trail          | A history of administrative changes and actions.                                                                                         |
| Pagination           | Returning a long list in smaller pages.                                                                                                  |
| Container            | An isolated process environment with its application and dependencies.                                                                   |
| Named volume         | Docker-managed storage retained independently of a container.                                                                            |
| Integration test     | A check that several components work together.                                                                                           |
| Environment variable | A setting supplied to a process without changing source code.                                                                            |
