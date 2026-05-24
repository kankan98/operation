## ADDED Requirements

### Requirement: Internal V0 public preview verifies database-backed entry
The internal V0 public-preview mode SHALL verify the database-backed V0
bootstrap path, not only static route rendering.

#### Scenario: Bootstrap route succeeds after deployment
- **WHEN** the internal V0 public preview is deployed with explicit preview
  flags and a reachable preview `DATABASE_URL`
- **THEN** `POST /api/auth/operator-v0-session` with the required CSRF header
  SHALL return a successful response and issue the preview session cookie needed
  by existing V0 browser workflows

#### Scenario: Public preview health includes protected V0 access
- **WHEN** a change affecting internal V0 public preview is archived and Docker
  is redeployed
- **THEN** verification SHALL include at least one database-backed V0 bootstrap
  or protected-session check in addition to static public route checks

#### Scenario: Missing preview database fails safely
- **WHEN** the preview web container lacks `DATABASE_URL` or cannot reach the
  configured database
- **THEN** protected V0 bootstrap/API routes SHALL fail without exposing raw
  database URLs, cookies, session references, provider keys, or protected
  business records
