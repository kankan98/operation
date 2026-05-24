# auth-route-runtime Specification

## Purpose
Define the local-only auth Route Handler runtime that exposes safe browser
session state and CSRF-checked logout over the existing app-owned auth
cookie/session runtime without introducing a login provider, middleware, team
management UI, or protected business CRUD.
## Requirements
### Requirement: Auth route runtime returns safe session views
The project SHALL provide a local-only public auth session Route Handler that
maps the existing app-owned auth cookie, session resolver, and authorization
guard into a safe browser-readable JSON view.

#### Scenario: Missing cookie returns unauthenticated session view
- **WHEN** `GET /api/auth/session` receives no auth session cookie
- **THEN** the route returns a safe unauthenticated JSON response without
  calling protected repository code or exposing raw cookie/session details

#### Scenario: Authenticated scoped session returns safe context
- **WHEN** `GET /api/auth/session` receives a valid auth session cookie and a
  requested tenant/team scope for an active membership with `read_workspace`
  permission
- **THEN** the route returns a safe authenticated JSON response containing
  actor, tenant, team, role, permissions, and session status/expiration without
  raw cookie values, session references, provider tokens, provider payloads, or
  protected business records

#### Scenario: Cookie is present but tenant/team scope is missing
- **WHEN** `GET /api/auth/session` receives an auth session cookie but no
  tenant/team scope in query parameters or accepted headers
- **THEN** the route returns a safe invalid-context JSON response and does not
  guess a default team

#### Scenario: Session cookie is unusable
- **WHEN** `GET /api/auth/session` receives an expired, revoked, invalidated,
  unknown, inactive-membership, forbidden-role, missing-permission, or
  cross-team session path
- **THEN** the route returns a safe error JSON response through the existing
  auth error semantics without exposing cross-team record existence or raw
  session data

### Requirement: Auth route runtime protects logout with CSRF header
The project SHALL provide a local-only public auth logout Route Handler that
requires a custom CSRF request header before mutating session state or clearing
the browser cookie.

#### Scenario: Logout without CSRF header is blocked
- **WHEN** `POST /api/auth/logout` receives no valid `x-operation-csrf` logout
  header
- **THEN** the route returns a safe forbidden JSON response and does not
  invalidate a session or return a clear-cookie header

#### Scenario: Active cookie session is logged out
- **WHEN** `POST /api/auth/logout` receives the required custom CSRF header and
  an active auth session cookie
- **THEN** the route invalidates the matching `auth_sessions` row with logout
  reason, returns a safe logout JSON response, and includes a clear-cookie
  `Set-Cookie` header

#### Scenario: Logout has no usable cookie
- **WHEN** `POST /api/auth/logout` receives the required custom CSRF header but
  no auth cookie or a cookie that does not map to a known active session
- **THEN** the route returns an idempotent safe logout JSON response and
  includes a clear-cookie `Set-Cookie` header without exposing raw cookie values

#### Scenario: Logged-out cookie is reused through session route
- **WHEN** a previously logged-out cookie is used for a later
  `GET /api/auth/session` request
- **THEN** the route denies the session because the app-owned session ledger is
  no longer active

### Requirement: Auth route runtime responses are cache-safe and secret-safe
The auth route runtime SHALL make session and logout responses safe for browser
consumption by preventing caching and redacting sensitive auth metadata.

#### Scenario: Auth route responses are not cached
- **WHEN** either auth route returns JSON
- **THEN** the response includes a `Cache-Control: no-store` header

#### Scenario: Auth route errors redact sensitive metadata
- **WHEN** auth route handling fails because of an auth guard, session, cookie,
  provider-shaped, token-shaped, or unexpected error path
- **THEN** the response JSON avoids raw cookies, session references, provider
  tokens, authorization headers, invitation secrets, and protected business data

### Requirement: Auth route runtime verification is repeatable
The auth route runtime SHALL include repeatable local verification that proves
safe session view, logout, CSRF, redaction, and rollback behavior without
changing public UI rendering.

#### Scenario: Auth route check runs against local PostgreSQL
- **WHEN** a developer or agent runs the documented auth route check with a
  valid local PostgreSQL database
- **THEN** the check verifies unauthenticated session query, authenticated
  scoped session query, missing-scope response, CSRF-blocked logout, successful
  logout, missing-cookie logout, logged-out cookie reuse, response redaction,
  no-store headers, and transaction rollback

#### Scenario: Local PostgreSQL is unavailable
- **WHEN** local PostgreSQL is unavailable in the current environment
- **THEN** the final report identifies which auth route checks were skipped and
  which command should be rerun when the service is available

### Requirement: Auth route runtime provides a gated local V0 operator bootstrap
The auth route runtime SHALL provide a local-only, explicitly gated operator V0
bootstrap Route Handler that seeds or reuses one internal operator context and
issues an app-owned auth session cookie through the existing auth session and
cookie runtime without introducing a production login provider.

#### Scenario: Bootstrap route is disabled outside allowed environments
- **WHEN** the operator V0 bootstrap route receives a request while local
  development mode is not active and the explicit bootstrap enablement flag is
  absent
- **THEN** the route SHALL return a safe disabled response, SHALL NOT create or
  mutate auth/team records, and SHALL NOT include a `Set-Cookie` header

#### Scenario: Bootstrap route requires custom header
- **WHEN** the operator V0 bootstrap route receives a request without the valid
  custom bootstrap CSRF header
- **THEN** the route SHALL return a safe forbidden response before opening the
  database and SHALL NOT issue a session cookie

#### Scenario: Bootstrap route creates safe session
- **WHEN** the operator V0 bootstrap route is enabled and receives the valid
  custom bootstrap CSRF header
- **THEN** it SHALL ensure deterministic internal tenant, team, operator,
  tenant membership, and team membership records exist, create a new active
  app-owned auth session ledger row, return the session cookie using the
  existing auth cookie runtime, and return only safe tenant/team/actor context

#### Scenario: Bootstrap route response is secret-safe
- **WHEN** the operator V0 bootstrap route succeeds or fails
- **THEN** the response JSON SHALL avoid raw session references, cookie values,
  provider tokens, authorization headers, database URLs, invitation secrets, and
  protected business records

#### Scenario: Bootstrap route is not a production provider
- **WHEN** the operator V0 bootstrap route is implemented
- **THEN** it SHALL NOT add OAuth, password login, provider callback, invitation
  flow, team management UI, provider tokens, or middleware-wide protected route
  behavior
