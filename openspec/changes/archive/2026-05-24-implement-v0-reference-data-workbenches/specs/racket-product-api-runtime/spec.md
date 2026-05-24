## MODIFIED Requirements

### Requirement: Racket product API runtime remains local-only and protected
The project SHALL expose racket product create/list behavior through local-only
Route Handlers that require the existing app-owned auth cookie/session runtime,
explicit tenant/team scope, server-side authorization, and existing repository
business rules before returning or mutating product records.

#### Scenario: Public workspace remains static without database config
- **WHEN** existing public workspace pages render without `DATABASE_URL`
- **THEN** they SHALL continue to render safe entry/static states and SHALL NOT
  import the racket product repository modules or attempt protected data access
  before an authenticated scoped browser workflow is entered

#### Scenario: No active login provider is introduced
- **WHEN** the racket product API runtime is used by a local V0 browser workbench
- **THEN** it SHALL NOT add a login provider, provider callback, middleware,
  team management UI, or Server Action; browser forms SHALL call the existing
  protected Route Handlers with explicit scope and CSRF

## ADDED Requirements

### Requirement: Racket product API supports V0 browser product creation
The existing racket product API runtime SHALL support V0 browser creation and listing of scoped racket product records without requiring new database tables or external providers.

#### Scenario: Browser creates product
- **WHEN** an authenticated V0 operator calls the product create route with explicit scope, CSRF, racket model, aliases, specs, audience, play style, price band, selling focus, and limitations
- **THEN** the route SHALL create a scoped product through the existing repository and return safe no-store JSON with the product view and readiness state

#### Scenario: Browser lists products
- **WHEN** an authenticated V0 operator calls the product list route with explicit scope
- **THEN** the route SHALL return scoped product records suitable for the `/rackets` browser workbench without cross-team data

#### Scenario: Unsafe product creation is rejected safely
- **WHEN** the browser sends sensitive, duplicate, malformed, alias-conflicting, unsupported, or cross-team product data
- **THEN** the route SHALL return the existing safe route error without exposing raw cookies, auth references, database URLs, prompts, provider payloads, raw customer messages, or cross-team records
