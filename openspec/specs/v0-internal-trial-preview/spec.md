# v0-internal-trial-preview Specification

## Purpose
TBD - created by archiving change ship-v0-internal-trial-preview. Update Purpose after archive.
## Requirements
### Requirement: Internal V0 public preview enables browser workflow evaluation
The project SHALL provide an explicitly gated internal V0 public-preview mode
that lets evaluators complete the existing V0 operator browser workflow from
the Docker preview without introducing production authentication.

#### Scenario: Preview mode is disabled by default
- **WHEN** the application runs without the explicit internal V0 preview cookie
  flag
- **THEN** public HTTP preview requests SHALL keep the secure-by-default auth
  cookie behavior and SHALL NOT silently issue insecure session cookies

#### Scenario: Preview mode is explicitly enabled
- **WHEN** the V0 bootstrap flag and the internal V0 preview cookie flag are
  both enabled
- **THEN** the V0 bootstrap route MAY issue a short-lived non-`Secure`
  `HttpOnly` session cookie for the deterministic internal V0 operator/team
  context so existing V0 pages can call protected scoped APIs over the HTTP
  preview

#### Scenario: Preview mode is not production authentication
- **WHEN** internal V0 preview mode is enabled
- **THEN** the project SHALL NOT add OAuth, password login, magic link, provider
  callbacks, invitation flows, team management, middleware-wide protected
  routing, provider tokens, or production account semantics

### Requirement: Internal V0 preview handles sensitive-data boundaries
The internal V0 public-preview mode SHALL remain suitable only for demo or
internal evaluation data and SHALL preserve existing secret redaction behavior.

#### Scenario: Sensitive data is out of scope
- **WHEN** documentation or roadmap status describes the internal V0 preview
- **THEN** it SHALL state that real customer private messages, order data,
  addresses, phone numbers, supplier data, pricing strategy, and full raw
  transcripts must not be entered into the HTTP preview

#### Scenario: Preview auth errors are safe
- **WHEN** preview bootstrap, session verification, logout, or protected V0 API
  calls fail
- **THEN** responses SHALL avoid raw cookies, session references, provider
  tokens, authorization headers, database URLs, invitation secrets, and
  protected business records

### Requirement: Internal V0 preview verification is repeatable
The project SHALL include repeatable local verification and pre-archive browser
verification for the internal V0 public-preview path.

#### Scenario: Local preview check passes
- **WHEN** local PostgreSQL is available and the preview verification command
  runs with explicit preview flags
- **THEN** it SHALL verify default-disabled behavior, explicit preview cookie
  issue attributes, short session expiration, scoped session verification,
  logout clearing behavior, no-store responses, secret redaction, and rollback

#### Scenario: Browser verification runs before archive
- **WHEN** this change is ready to archive
- **THEN** Playwright SHALL verify at least one local desktop and one local
  mobile V0 browser flow using the preview cookie policy before Docker
  deployment

#### Scenario: Public preview is checked after archive
- **WHEN** this change is archived and Docker is redeployed
- **THEN** the named `operation-web-preview` container SHALL run with the
  documented preview flags, keep the `unless-stopped` restart policy, and return
  HTTP 200 for the relevant public routes

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

### Requirement: Internal preview verifies unified trial access
The internal V0 public preview SHALL verify the unified trial access path in addition to static route health whenever this workflow is archived and deployed.

#### Scenario: Public preview trial access smoke passes
- **WHEN** the Docker public preview is deployed with explicit V0 preview flags and a reachable preview database
- **THEN** verification SHALL include bootstrap with the custom CSRF header, scoped session or protected V0 API access, and safe non-secret output

#### Scenario: Public preview trial access remains demo-only
- **WHEN** the unified trial access UI appears on the HTTP public preview
- **THEN** it SHALL communicate internal/demo team entry in concise operator language and SHALL NOT invite real customer private messages, order data, supplier data, pricing strategy, or full raw transcripts

#### Scenario: Preview flags are missing
- **WHEN** the internal preview bootstrap or access path is disabled by environment flags
- **THEN** the unified trial access surface SHALL fail safely with a re-enter or unavailable state and SHALL NOT issue a session cookie silently

