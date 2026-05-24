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

