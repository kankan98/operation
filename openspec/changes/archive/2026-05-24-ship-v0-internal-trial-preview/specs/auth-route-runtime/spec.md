## MODIFIED Requirements

### Requirement: Auth route runtime protects logout with CSRF header
The project SHALL provide a local-only public auth logout Route Handler that
requires a custom CSRF request header before mutating session state or clearing
the browser cookie. The logout route SHALL clear cookies using the active
default or explicit internal V0 preview cookie policy.

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
  `Set-Cookie` header using the active cookie policy

#### Scenario: Logout has no usable cookie
- **WHEN** `POST /api/auth/logout` receives the required custom CSRF header but
  no auth cookie or a cookie that does not map to a known active session
- **THEN** the route returns an idempotent safe logout JSON response and
  includes a clear-cookie `Set-Cookie` header using the active cookie policy
  without exposing raw cookie values

#### Scenario: Logged-out cookie is reused through session route
- **WHEN** a previously logged-out cookie is used for a later
  `GET /api/auth/session` request
- **THEN** the route denies the session because the app-owned session ledger is
  no longer active

### Requirement: Auth route runtime provides a gated local V0 operator bootstrap
The auth route runtime SHALL provide a local-only or explicitly enabled internal
V0 operator bootstrap Route Handler that seeds or reuses one internal operator
context and issues an app-owned auth session cookie through the existing auth
session and cookie runtime without introducing a production login provider.

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
  custom bootstrap CSRF header under the default cookie policy
- **THEN** it SHALL ensure deterministic internal tenant, team, operator,
  tenant membership, and team membership records exist, create a new active
  app-owned auth session ledger row, return the session cookie using the
  existing secure-by-default auth cookie runtime, and return only safe
  tenant/team/actor context

#### Scenario: Bootstrap route creates explicit internal preview session
- **WHEN** the operator V0 bootstrap route is enabled, receives the valid custom
  bootstrap CSRF header, and the explicit internal V0 preview cookie flag is
  active
- **THEN** it SHALL create a short-lived active app-owned auth session ledger
  row, return the session cookie using the internal preview cookie policy, and
  return only safe tenant/team/actor context

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
