# racket-product-api-runtime Specification

## Purpose
Define the local-only protected racket product Route Handler runtime that
exposes product create/list behavior through existing app-owned auth
cookie/session, explicit tenant/team scope, CSRF-protected mutations,
repository business rules, safe JSON responses, and rollback-based local
verification without introducing a login provider, Server Actions,
source/review/publish APIs, AI/RAG, external providers, or production
persistence.
## Requirements
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

### Requirement: Racket product API exposes local review workflow endpoints
The racket product API runtime SHALL expose local-only protected endpoints for product source registration, review queue listing, review decisions, review submission, and publish while preserving the existing create/list route contract.

#### Scenario: Existing create list behavior is preserved
- **WHEN** `GET /api/rackets/products` or `POST /api/rackets/products` is used by the V0 browser workflow
- **THEN** the existing scoped list/create behavior, CSRF behavior, safe errors, no-store headers, and repository business rules SHALL remain intact

#### Scenario: Product path parameter is authoritative
- **WHEN** a client posts to a product-scoped source, submit, or publish route and also includes a different `productId` in JSON
- **THEN** the route SHALL use the path product ID as the target and SHALL NOT trust client-supplied ownership or conflicting target fields

#### Scenario: Mutation routes require CSRF before database access
- **WHEN** any racket source, submit, review-decision, or publish mutation route receives no valid `x-operation-csrf: racket-products` header
- **THEN** the route SHALL return a safe forbidden response without opening the database or mutating records

### Requirement: Racket product API returns safe workflow view models
The racket product API runtime SHALL return safe view models for products, sources, and review queue items rather than database records or auth/session internals.

#### Scenario: Source registration returns source view
- **WHEN** a source is registered successfully
- **THEN** the response SHALL include source ID, product ID, source type, title, URL when non-sensitive, retrieved time, trust level, refresh policy, review state, and timestamps

#### Scenario: Review queue returns source summary
- **WHEN** review queue listing succeeds
- **THEN** the response SHALL include product view, safe source views, and source summary counts for total, approved, pending, rejected, and stale sources

#### Scenario: Review decision target response is typed
- **WHEN** a review decision updates a source or product
- **THEN** the response SHALL indicate whether the returned target is a source or product so the browser can update the right local state without guessing
