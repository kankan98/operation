## ADDED Requirements

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
