## Why

Future browser save flows for products, sessions, knowledge, AI review runs,
talk tracks, and next-session tasks need a request-facing auth boundary before
they can safely expose protected Route Handlers or Server Actions. The project
already has local guard, session, and cookie runtimes, but it still cannot let
the browser ask "who am I?" or request logout through a controlled public API.

Reliable-source checks shaped the scope:

- Next.js official Route Handler docs confirm `route.ts` handlers can receive
  standard `Request` objects and return `Response` objects for App Router API
  boundaries: `https://nextjs.org/docs/app/getting-started/route-handlers-and-middleware`.
- Next.js official authentication guidance keeps authentication and
  authorization decisions on the server and separates route protection from
  data access authorization: `https://nextjs.org/docs/app/guides/authentication`.
- OWASP CSRF Prevention guidance says SameSite cookies are defense in depth,
  not a complete state-changing request defense; custom request headers are a
  recommended pattern because they require same-origin script control:
  `https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html`.
- MDN cookie guidance confirms `HttpOnly`, `Secure`, `SameSite`, `Path`, and
  `Max-Age` are cookie response attributes, not business authorization:
  `https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Set-Cookie`.

Skill-backed value exploration:

- OpenSpec exploration: the smallest useful next wave is an auth Route Handler
  layer over the existing cookie/session runtime, not a full provider/login
  implementation.
- Problem statement: a live-commerce operator trying to save future work needs
  the app to know the current actor/team and to stop trusting the session after
  logout or expiry; otherwise later product/session/AI save flows risk wrong
  attribution or unsafe access.
- Opportunity-solution tree: the most valuable prerequisite opportunity is
  "protected browser workflows lack a safe HTTP auth boundary"; `GET
  /api/auth/session` and CSRF-checked `POST /api/auth/logout` are the smallest
  testable solution.
- Codebase recon: this is still a very small repo with auth/data runtime as
  the risk center, so the change should be narrow, verifier-first, and
  provider-neutral.
- TDD and verification skills: add a route verifier first, observe failure,
  then implement only the route behavior required to pass.

## What Changes

- Add a local-only auth Route Handler runtime that maps existing
  cookie/session/auth guard results into safe JSON views.
- Add `GET /api/auth/session` to read the app-owned auth cookie and return a
  safe authenticated context view or a safe unauthenticated response without
  exposing raw cookie, session reference, provider token, or protected payloads.
- Add `POST /api/auth/logout` to require an explicit custom CSRF header,
  invalidate the existing app-owned session when present, and always return a
  clear-cookie header for idempotent logout.
- Add a rollback verifier and scripts covering unauthenticated session query,
  authenticated context query, CSRF-blocked logout, successful logout, missing
  cookie logout, logged-out cookie reuse, redaction, and transaction rollback.
- Update auth contract, route/runtime docs, and roadmap status so future agents
  can distinguish public auth routes from complete provider login, middleware,
  team management, and protected business CRUD.
- Keep public pages unchanged. No login provider, login page, provider
  callback, middleware/proxy protection, invitation flow, team switcher, or
  business CRUD endpoint is introduced in this change.

## Capabilities

### New Capabilities

- `auth-route-runtime`: Local-only public Route Handlers for safe session view,
  CSRF-checked logout, cookie clearing, and repeatable verification around the
  existing app-owned auth cookie/session runtime.

### Modified Capabilities

- `auth-team-tenant-contract`: Record the implemented public auth route
  runtime surface, CSRF requirement for logout, and remaining provider/login,
  middleware, team management, and protected business CRUD non-goals.

## Impact

- Affected code: `apps/web/src/app/api/auth/**`, `apps/web/src/server/auth/*`,
  and package scripts.
- Affected docs: `docs/contracts/auth-team-tenant.md`,
  `docs/architecture/technical-implementation-roadmap.md`,
  `docs/roadmap/ai-continuous-development-goal.md`,
  `docs/roadmap/autonomous-development-roadmap.md`, `README.md`, and
  `apps/web/README.md` if route status tables are present.
- No new npm dependency. The implementation uses existing Next.js Route
  Handlers, standard `Request`/`Response`, existing cookie/session helpers,
  Drizzle/PostgreSQL, and Zod where validation is needed.
- No new database table is expected; logout reuses the existing `auth_sessions`
  ledger.
- Rollback path: remove the route runtime module, API route files, verifier
  script, package scripts, docs/spec updates, and keep the existing local auth
  guard/session/cookie runtime.
