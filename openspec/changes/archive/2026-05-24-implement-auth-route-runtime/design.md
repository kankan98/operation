## Context

The auth stack now has three local-only server boundaries:

- `auth-guard-foundation`: resolves app-owned users, tenants, teams,
  memberships, roles, permissions, and target scope into `AuthContext`.
- `auth-session-runtime`: resolves an opaque app-owned session reference from
  the `auth_sessions` ledger and delegates permission checks to the guard.
- `auth-cookie-runtime`: reads/writes the session cookie header and invalidates
  the ledger on logout.

The missing layer is the public App Router API boundary. Future browser saves
and thin Server Actions need an HTTP-level way to query current auth state and
request logout without importing database, cookie, or session internals into UI
code.

External source conclusions:

- Next.js Route Handlers are the correct App Router HTTP boundary for `GET` and
  `POST` requests using standard `Request`/`Response` APIs.
- Next.js authentication guidance keeps authorization server-side and does not
  make UI route protection a substitute for data-layer authorization.
- OWASP CSRF guidance treats SameSite as defense in depth and recommends custom
  request headers for state-changing requests.
- MDN cookie documentation confirms secure cookie attributes live at response
  header boundaries; route JSON must still avoid raw cookie/session values.

## Goals / Non-Goals

**Goals:**

- Add a provider-neutral local-only auth route helper module over the existing
  cookie/session runtime.
- Implement `GET /api/auth/session` with `read_workspace` authorization for a
  requested tenant/team scope.
- Return safe auth JSON views that never include raw cookie values, raw session
  references, provider tokens, provider payloads, membership internals, or
  protected business data.
- Implement `POST /api/auth/logout` with a required custom CSRF header before
  any session invalidation or cookie clearing.
- Make logout idempotent when no cookie exists and invalidate the existing
  app-owned session ledger when a usable cookie exists.
- Add a rollback verifier that calls the route helpers with a transaction-bound
  repository before public route files are treated as complete.
- Record the route runtime status in the auth contract and roadmap.

**Non-Goals:**

- No Auth.js, OAuth, password, magic link, SSO, provider callback, account
  linking, provider SDK, provider account table, or production auth service.
- No login page, login route, team switcher UI, invitation flow, middleware or
  proxy page protection.
- No protected business CRUD or AI/RAG endpoint.
- No browser UI changes and no Playwright-required rendered surface change.
- No new database table, migration, npm dependency, queue, storage, analytics,
  or observability provider.

## Decisions

### 1. Put route behavior in `auth/route.ts`, keep route files thin

Add a server-only helper module that owns request parsing, response shaping,
status mapping, CSRF header validation, and safe JSON views. The actual
`app/api/auth/**/route.ts` files should short-circuit no-cookie session checks
and CSRF-blocked or missing-cookie logout paths without opening a database
connection. When a cookie-backed lookup or mutation is needed, they create/close
a database connection, create the existing auth session repository, and delegate
to the helper.

Alternative considered: put all logic directly in route files. Rejected because
the rollback verifier needs to run against a transaction-bound repository
without opening a separate database connection.

### 2. Require explicit tenant/team scope for session view

`GET /api/auth/session` will read `tenantId` and `teamId` from query parameters
or `x-operation-tenant-id` / `x-operation-team-id` headers. With no cookie, it
returns a safe unauthenticated response. With a cookie but no scope, it returns
a safe invalid-context response. With cookie and scope, it delegates to the
existing cookie/session/guard chain using `requiredPermission:
read_workspace`.

Alternative considered: infer the first or default active team from the session
user. Rejected for this wave because default team selection, multi-team
behavior, and team switching need their own provider/login/team UX decisions.
The explicit scope keeps this prerequisite route honest and avoids inventing
future navigation rules.

### 3. Use a custom logout CSRF header

`POST /api/auth/logout` must require `x-operation-csrf: logout` before calling
the session invalidation helper. Requests missing the header return a safe
403-style JSON response and do not clear cookies or mutate session state.

Alternative considered: rely on `SameSite=Lax` because the auth cookie already
uses it. Rejected because OWASP treats SameSite as defense in depth, not a
complete CSRF control for state-changing endpoints.

### 4. Keep route responses cache-safe and secret-safe

Both routes return `Cache-Control: no-store`. Session responses expose only:

- `authenticated`
- actor id/display name
- tenant id/name
- team id/name
- role and permissions
- session status and expiration timestamps

They do not expose raw session reference, raw cookie value, provider session id,
authorization header, membership record IDs, full error details, or protected
business records.

Alternative considered: return `AuthContext` and `AuthSessionSummary`
directly. Rejected because those server types include more internals than a
browser auth-state endpoint needs.

### 5. Verify route helpers before adding production route files

Add `auth:route-check` first, import the planned helper exports, and observe
the expected failure before implementing them. The verifier should seed local
identity/session records inside a rollback transaction, invoke helper functions
with native `Request` instances, and check JSON/status/header behavior.

Alternative considered: only curl the public routes after implementation.
Rejected because no login provider exists to create a browser session and curl
cannot prove transaction rollback or redaction around seeded auth records.

## Risks / Trade-offs

- Route runtime could be mistaken for complete login: update the auth contract,
  accepted specs, README, and roadmaps to say provider/login/middleware/team UI
  remain unimplemented.
- Explicit tenant/team scope adds client responsibility: acceptable for this
  local-only prerequisite because team selection is not implemented yet; future
  provider/login or team switcher work can replace or wrap this behavior.
- CSRF header requires client code to set a custom header: acceptable because
  browser logout should be initiated by same-origin app code, and no public UI
  calls it yet.
- Per-request database connection in route files is not production pooling:
  current project uses local-only database runtime; production connection
  pooling remains a later stage decision. No-cookie and CSRF-blocked paths
  short-circuit before database access so public preview visitors do not need a
  database just to receive safe auth-state responses.
- No browser verification: acceptable because this change adds API routes and
  server verifier coverage without changing rendered UI.

## Migration Plan

1. Add failing `auth-route-check` verifier and scripts.
2. Implement `auth/route.ts` safe response helpers.
3. Add thin `app/api/auth/session/route.ts` and
   `app/api/auth/logout/route.ts`.
4. Update auth contract, route/runtime docs, roadmaps, and OpenSpec deltas.
5. Run OpenSpec validation, auth verifier scripts, typecheck, lint, build, and
   post-archive Docker preview verification.

Rollback:

- Remove `auth/route.ts`, the two API route files, `auth-route-check`, scripts,
  docs/spec deltas, and README updates. Existing auth guard, session, and cookie
  runtimes continue to work.

## Open Questions

- Should future provider/login issue a default tenant/team redirect or expose a
  dedicated team-selection endpoint?
- Should future logout also be available as a Server Action wrapper for UI
  forms?
- Which pages should eventually use middleware redirects versus data-layer
  authorization only?
- Should production auth routes add origin/referrer validation in addition to
  the custom CSRF header?
