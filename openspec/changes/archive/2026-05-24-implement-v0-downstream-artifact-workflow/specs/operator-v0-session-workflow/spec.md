## MODIFIED Requirements

### Requirement: Local V0 operator entry creates a safe team-scoped session
The project SHALL provide a local-only operator V0 entry path that can seed or
reuse one internal operator, tenant, and live-operations team, issue an app-owned
HttpOnly session cookie through the existing auth session runtime, and return the
tenant/team context needed by browser workflows. The seeded V0 team membership
SHALL include the permissions needed for the internal V0 workflow loop:
`read_workspace`, `capture_session`, `run_ai_review`, `manage_talk_tracks`, and
`manage_next_tasks`.

#### Scenario: Bootstrap is gated
- **WHEN** the V0 operator entry route is called while neither local development
  mode nor the explicit bootstrap enablement flag is active
- **THEN** the route SHALL return a safe disabled response, SHALL NOT create a
  user, tenant, team, membership, or auth session, and SHALL NOT return a
  `Set-Cookie` header

#### Scenario: Bootstrap requires custom CSRF header
- **WHEN** the V0 operator entry route is called without the valid custom
  bootstrap CSRF header
- **THEN** the route SHALL return a safe forbidden response, SHALL NOT open the
  database, and SHALL NOT issue a session cookie

#### Scenario: Bootstrap succeeds
- **WHEN** the V0 operator entry route is enabled and called with the valid
  custom bootstrap CSRF header
- **THEN** the route SHALL ensure the internal V0 tenant, team, operator,
  tenant membership, and team membership exist, create a fresh active app-owned
  auth session ledger row, return a `Set-Cookie` header through the existing
  auth cookie runtime, and return a safe JSON body containing tenant/team/actor
  display context and the internal V0 permissions without raw session references

#### Scenario: Bootstrap is idempotent for context
- **WHEN** the V0 operator entry route is called more than once
- **THEN** it SHALL reuse deterministic internal tenant/team/operator ownership
  records, ensure the membership still has the internal V0 permissions, create a
  fresh auth session for the new browser entry, and SHALL NOT fail due to
  duplicate seed records
