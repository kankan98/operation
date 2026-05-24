# racket-source-review-publish Specification

## Purpose
TBD - created by archiving change implement-racket-source-review-publish. Update Purpose after archive.
## Requirements
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

### Requirement: Racket source schema preserves provenance and ownership
The project SHALL define Drizzle/PostgreSQL schema for racket product sources and review decisions with tenant/team ownership, product linkage, source type, trust level, refresh policy, review state, reviewer decisions, actor audit fields, timestamps, and scoped indexes.

#### Scenario: Source table is reviewed
- **WHEN** the migration for racket source review is reviewed
- **THEN** racket product sources include tenant ID, team ID, product ID, source type, title, URL or source key, retrieved time, trust level, refresh policy, review state, created/updated actor IDs, and timestamps

#### Scenario: Review decision table is reviewed
- **WHEN** the migration for racket source review is reviewed
- **THEN** racket review decisions include tenant ID, team ID, product ID, target type, target ID, decision, reason, reviewed actor ID, request ID, and reviewed timestamp

#### Scenario: Scoped source identity is enforced
- **WHEN** the same source is registered more than once for the same product in the same tenant/team
- **THEN** the repository and database prevent duplicate source records while allowing the same source key in a different team scope

### Requirement: Repository registers validated scoped product sources
The project SHALL provide a server-only repository method that registers a racket product source after validating input, checking `manage_products`, verifying the product belongs to the authorized tenant/team, computing a normalized source key, and assigning tenant/team and actor audit metadata from the data access context.

#### Scenario: Product source is registered
- **WHEN** an authorized actor with `manage_products` registers a valid source for an existing racket product in the actor's team
- **THEN** the repository persists a pending source under the same tenant/team scope and returns a source view

#### Scenario: Product source target is missing
- **WHEN** an actor registers a source for a product ID that does not exist in the actor's tenant/team
- **THEN** the repository rejects the command with a not-found error and no source is created

#### Scenario: Duplicate source is submitted
- **WHEN** an actor registers the same normalized source key for the same product in the same tenant/team
- **THEN** the repository rejects the command with a source-conflict error and does not create a duplicate source

#### Scenario: Actor lacks product permission
- **WHEN** a data access context without `manage_products` attempts to register a product source
- **THEN** the repository rejects the operation before writing source records

### Requirement: Repository records review decisions and controls state transitions
The project SHALL provide server-only repository methods that submit products for review, record reviewer decisions for products or sources, and update product/source state only through allowed transitions.

#### Scenario: Product is submitted for review
- **WHEN** an authorized actor with `manage_products` submits a source-backed draft or needs-source product for review
- **THEN** the repository moves the product to `reviewing` and keeps downstream readiness blocked by review and publication

#### Scenario: Source is approved
- **WHEN** an actor with `review_knowledge` approves a pending source for a product in the actor's team
- **THEN** the repository records a review decision and marks that source as `approved`

#### Scenario: Product is approved
- **WHEN** an actor with `review_knowledge` approves a reviewing product that has at least one approved source
- **THEN** the repository records a review decision and moves the product to `approved`

#### Scenario: Invalid transition is requested
- **WHEN** a reviewer attempts to approve or publish a product without an approved source, or attempts a transition that is not allowed from the current state
- **THEN** the repository rejects the operation with a state-transition or missing-source error and leaves the existing state unchanged

#### Scenario: Actor lacks review permission
- **WHEN** a data access context without `review_knowledge` attempts to record a review decision
- **THEN** the repository rejects the operation before changing product or source state

### Requirement: Repository publishes only approved source-backed products
The project SHALL provide a server-only repository method that publishes a product only when the product is approved, at least one approved source exists in the same tenant/team, no blocking review conflict is present, and the actor has `review_knowledge`.

#### Scenario: Approved product is published
- **WHEN** a reviewer publishes an approved product with an approved source
- **THEN** the repository sets product status to `published`, records publication audit metadata, writes approved source IDs into the compatibility `sourceIds` summary, and returns downstream readiness with supported workflows ready

#### Scenario: Unapproved product cannot publish
- **WHEN** a reviewer attempts to publish a product in `needs_source`, `reviewing`, `rejected`, `conflict`, `stale`, or `archived` state
- **THEN** the repository rejects the operation with a state-transition error and does not mark the product as published

#### Scenario: Cross-team source cannot enable publish
- **WHEN** another team has an approved source for a product with the same model
- **THEN** the repository does not count that source toward the current team's publish readiness

### Requirement: Repository lists tenant/team scoped racket review queue
The project SHALL provide a server-only repository query that lists products requiring source, review, or publication work only within the authorized tenant/team scope, supports bounded pagination, and includes source and readiness summaries for each item.

#### Scenario: Review queue is listed
- **WHEN** an actor with `read_workspace`, `manage_products`, or `review_knowledge` lists the racket review queue
- **THEN** the repository returns only products from the actor's authorized tenant/team that are not archived or already fully published, with source counts and readiness blockers

#### Scenario: Cross-team queue records exist
- **WHEN** another team has source-backed or reviewing products
- **THEN** the review queue does not return those records to the current actor's team scope

#### Scenario: Review queue limit is too large
- **WHEN** a review queue query asks for more than the configured maximum number of records
- **THEN** validation rejects the query before database access

### Requirement: Racket source review verification is repeatable
The project SHALL include repeatable local verification for racket source review publish behavior that uses the local PostgreSQL database, runs inside rollback transactions for test data, and proves repository behavior without changing public UI behavior.

#### Scenario: Local source review check passes
- **WHEN** local PostgreSQL is migrated and the racket source review verification runs with a valid `DATABASE_URL`
- **THEN** it verifies source registration, duplicate source rejection, product review submission, source approval, product approval, publish gating, missing permission rejection, cross-team isolation, and transaction rollback

#### Scenario: Existing checks still pass
- **WHEN** the racket source review implementation is completed
- **THEN** existing lint, typecheck, build, data foundation check, auth guard check, and product persistence check remain passing

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

