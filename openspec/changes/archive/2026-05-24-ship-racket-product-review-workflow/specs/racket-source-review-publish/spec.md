## MODIFIED Requirements

### Requirement: Racket source review publish runtime remains local-only and server-only
The project SHALL implement racket product source registration, review decisions, review queue, and publish gating as a local-only runtime slice that exposes protected local Route Handlers and the V0 `/rackets` browser workflow without introducing Server Actions, AI/RAG grounding, source discovery, or production database/provider behavior.

#### Scenario: Public workspace renders without source review runtime
- **WHEN** existing public workspace pages render without `DATABASE_URL`
- **THEN** they continue to use safe entry/static states and do not import racket source review repository modules before an authenticated scoped browser workflow is entered

#### Scenario: Source review script runs without database config
- **WHEN** the source review verification script runs without required local database configuration
- **THEN** it fails closed with a redacted actionable error instead of falling back to in-memory or unscoped persistence

#### Scenario: Browser workflow uses protected routes only
- **WHEN** the `/rackets` V0 browser workflow registers sources, submits products, records review decisions, lists the review queue, or publishes a product
- **THEN** it SHALL call protected local Route Handlers with explicit tenant/team scope and CSRF where required rather than calling repository modules, database clients, AI providers, RAG, or external source discovery directly

## ADDED Requirements

### Requirement: Protected routes expose source review publish commands
The project SHALL provide local-only protected racket product routes for source registration, product review submission, review queue listing, review decisions, and product publishing using the existing auth cookie/session runtime, explicit tenant/team scope, CSRF-protected mutations, repository state gates, no-store JSON, and safe error mapping.

#### Scenario: Product source is registered through route
- **WHEN** an authenticated actor with `manage_products` posts valid source metadata to `POST /api/rackets/products/[productId]/sources` with explicit authorized tenant/team scope and the valid racket CSRF header
- **THEN** the route SHALL persist a pending source for that scoped product and return a safe source view with `Cache-Control: no-store`

#### Scenario: Product is submitted through route
- **WHEN** an authenticated actor with `manage_products` posts to `POST /api/rackets/products/[productId]/submit` for a source-backed draft or needs-source product
- **THEN** the route SHALL move the product to `reviewing` through the repository and return the updated product view

#### Scenario: Review queue is listed through route
- **WHEN** an authenticated actor with an authorized V0 team scope calls `GET /api/rackets/review-queue`
- **THEN** the route SHALL return only current-team products needing source, review, conflict, rejection, or publish work with source summaries and readiness blockers

#### Scenario: Review decision is recorded through route
- **WHEN** an authenticated actor with `review_knowledge` posts a valid source or product decision to `POST /api/rackets/review-decisions`
- **THEN** the route SHALL record the decision through the repository, update only allowed target state, and return the updated product or source view

#### Scenario: Product is published through route
- **WHEN** an authenticated actor with `review_knowledge` posts to `POST /api/rackets/products/[productId]/publish` for an approved product with at least one approved source
- **THEN** the route SHALL publish the product through the repository, return downstream-ready product state, and keep publication audit metadata server-owned

#### Scenario: Unsafe route requests are blocked
- **WHEN** a source/review/publish request is missing cookie, missing explicit scope, missing CSRF for mutation, lacks permission, crosses team scope, has malformed JSON, repeats a source, or violates state gates
- **THEN** the route SHALL return a safe JSON error without exposing raw cookies, session references, database URLs, provider payloads, source text from another team, or protected cross-team product data

### Requirement: Source review route verification is repeatable
The project SHALL extend local racket route verification to cover source registration, review queue, review submission, review decisions, publish gating, no-store headers, redaction, permission denial, cross-team isolation, and transaction rollback.

#### Scenario: Racket route check covers review workflow
- **WHEN** local PostgreSQL is migrated and `pnpm rackets:route-check` runs with a valid `DATABASE_URL`
- **THEN** it SHALL verify protected source/review/publish route behavior in rollback transactions without persisting test products
