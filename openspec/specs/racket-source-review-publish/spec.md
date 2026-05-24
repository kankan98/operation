# racket-source-review-publish Specification

## Purpose
TBD - created by archiving change implement-racket-source-review-publish. Update Purpose after archive.
## Requirements
### Requirement: Racket source review publish runtime remains local-only and server-only
The project SHALL implement racket product source registration, review decisions, review queue, and publish gating as a local-only, server-only runtime slice that does not expose public UI, Route Handler, Server Action, AI/RAG grounding, source discovery, or production database behavior.

#### Scenario: Public workspace renders without source review runtime
- **WHEN** existing public workspace pages render without `DATABASE_URL`
- **THEN** they continue to use static data and do not import racket source review repository modules

#### Scenario: Source review script runs without database config
- **WHEN** the source review verification script runs without required local database configuration
- **THEN** it fails closed with a redacted actionable error instead of falling back to in-memory or unscoped persistence

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

