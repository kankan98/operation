## ADDED Requirements

### Requirement: Racket product API runtime remains local-only and protected
The project SHALL expose racket product create/list behavior through local-only
Route Handlers that require the existing app-owned auth cookie/session runtime,
explicit tenant/team scope, server-side authorization, and existing repository
business rules before returning or mutating product records.

#### Scenario: Public workspace remains static without database config
- **WHEN** existing public workspace pages render without `DATABASE_URL`
- **THEN** they SHALL continue to use static data and SHALL NOT import the
  racket product API runtime or repository modules

#### Scenario: No active login provider is introduced
- **WHEN** the racket product API runtime is implemented
- **THEN** it SHALL NOT add a login provider, provider callback, middleware,
  team management UI, Server Action, or browser product form

### Requirement: Product list route resolves authorized scope before repository access
The project SHALL provide `GET /api/rackets/products` as a no-store JSON Route
Handler that resolves the auth session cookie, validates explicit tenant/team
scope, checks `read_workspace` access through the existing auth runtime, and
delegates listing to the existing racket product repository.

#### Scenario: Missing cookie is denied without database access
- **WHEN** `GET /api/rackets/products` receives no auth session cookie
- **THEN** the route SHALL return a safe unauthenticated JSON response without
  opening the database or exposing repository data

#### Scenario: Authenticated scoped list succeeds
- **WHEN** `GET /api/rackets/products` receives a valid auth session cookie and
  explicit authorized tenant/team scope
- **THEN** the route SHALL return only products from the actor's authorized
  tenant/team with aliases, specs, positioning, source IDs, readiness, and
  no-store cache headers

#### Scenario: Scope is missing
- **WHEN** `GET /api/rackets/products` receives an auth session cookie without
  tenant/team scope in query parameters or accepted headers
- **THEN** the route SHALL return a safe invalid-context response and SHALL NOT
  guess a default team

#### Scenario: Cross-team records exist
- **WHEN** another team has matching racket product records
- **THEN** the list route SHALL NOT return those records to the current actor
  or reveal whether they exist

### Requirement: Product create route protects mutations and delegates business rules
The project SHALL provide `POST /api/rackets/products` as a no-store JSON Route
Handler that requires a valid mutation CSRF header, resolves the auth session
cookie, validates explicit tenant/team scope, checks `manage_products` access,
parses product JSON, and delegates product creation to the existing racket
product repository.

#### Scenario: Missing CSRF header is blocked without database access
- **WHEN** `POST /api/rackets/products` receives no valid
  `x-operation-csrf` product mutation header
- **THEN** the route SHALL return a safe forbidden JSON response and SHALL NOT
  open the database or create a product

#### Scenario: Missing cookie is denied
- **WHEN** `POST /api/rackets/products` receives a valid CSRF header but no auth
  session cookie
- **THEN** the route SHALL return a safe unauthenticated JSON response and SHALL
  NOT create a product

#### Scenario: Authorized product create succeeds
- **WHEN** an actor with `manage_products` posts valid product JSON with
  explicit authorized tenant/team scope and the valid CSRF header
- **THEN** the route SHALL create the product under the actor's authorized
  tenant/team, return the repository product view, and include no-store cache
  headers

#### Scenario: Client-supplied ownership is ignored
- **WHEN** product JSON contains `tenantId`, `teamId`, `actorId`, or audit fields
  that differ from the authorized context
- **THEN** the route SHALL NOT use those fields for ownership or audit metadata
  and SHALL rely on the repository data access context

#### Scenario: Actor lacks product permission
- **WHEN** an authenticated actor without `manage_products` posts valid product
  JSON
- **THEN** the route SHALL reject the mutation before writing product or alias
  records

### Requirement: Racket product API errors are safe and cache-safe
The racket product API runtime SHALL map auth, validation, conflict, state, and
unexpected failures to safe HTTP JSON responses that do not expose secrets,
session references, provider payloads, raw authorization headers, database
credentials, or protected cross-team business data.

#### Scenario: Validation failure is safe
- **WHEN** a request body is malformed JSON or violates racket product input
  validation
- **THEN** the route SHALL return a safe validation error JSON response and
  SHALL NOT persist partial product records

#### Scenario: Duplicate model is reported as conflict
- **WHEN** an authorized actor creates a product whose normalized model already
  exists in the same tenant/team
- **THEN** the route SHALL return a safe duplicate-model conflict response and
  SHALL NOT create a second product

#### Scenario: Alias conflict is reported as conflict
- **WHEN** an authorized actor creates a product with an alias already linked to
  another product in the same tenant/team
- **THEN** the route SHALL return a safe alias-conflict response and SHALL NOT
  create a second product

#### Scenario: Sensitive metadata is redacted
- **WHEN** route handling fails because of auth, cookie, provider-shaped,
  token-shaped, repository, or unexpected error paths
- **THEN** the response JSON SHALL avoid raw cookies, session references,
  provider tokens, authorization headers, database URLs, invitation secrets, and
  protected cross-team product data

#### Scenario: API responses are not cached
- **WHEN** either racket product API route returns JSON
- **THEN** the response SHALL include `Cache-Control: no-store`

### Requirement: Racket product API verification is repeatable
The project SHALL include repeatable local verification for the racket product
API runtime that uses the local PostgreSQL database, runs inside rollback
transactions for test data, and proves Route Handler behavior without changing
public UI rendering.

#### Scenario: Route check runs against local PostgreSQL
- **WHEN** local PostgreSQL is migrated and `pnpm rackets:route-check` runs with
  a valid `DATABASE_URL`
- **THEN** it SHALL verify missing cookie denial, missing scope, CSRF blocking,
  authorized create/list, duplicate model rejection, validation failure, missing
  permission rejection, cross-team isolation, no-store headers, response
  redaction, and transaction rollback

#### Scenario: Existing checks still pass
- **WHEN** the racket product API runtime is completed
- **THEN** existing OpenSpec validation, auth route check, racket repository
  checks, typecheck, lint, and build verification SHALL remain passing
