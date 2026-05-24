## ADDED Requirements

### Requirement: Racket product persistence remains local-only and server-only
The project SHALL implement racket product persistence as a local-only, server-only runtime slice that does not expose public UI, Route Handler, Server Action, AI/RAG grounding, source import, or production database behavior.

#### Scenario: Public workspace renders without database config
- **WHEN** existing public workspace pages render without `DATABASE_URL`
- **THEN** they continue to use static data and do not import racket persistence modules

#### Scenario: Repository script runs without database config
- **WHEN** the racket persistence verification script runs without required local database configuration
- **THEN** it fails closed with a redacted actionable error instead of falling back to in-memory or unscoped persistence

### Requirement: Racket product schema preserves domain fields and ownership
The project SHALL define Drizzle/PostgreSQL schema for racket products and aliases with tenant/team ownership, audit fields, status, normalized model and alias fields, badminton-specific specifications, and database constraints for scoped uniqueness.

#### Scenario: Product table is reviewed
- **WHEN** the migration for racket product persistence is reviewed
- **THEN** racket products include tenant ID, team ID, brand, series, model, normalized model, review status, weight classes, balance fields, shaft stiffness, recommended tension, player levels, play styles, price band, selling focus, limitations, created/updated actor IDs, and timestamps

#### Scenario: Alias table is reviewed
- **WHEN** the migration for racket product persistence is reviewed
- **THEN** racket aliases include tenant ID, team ID, product ID, alias text, normalized alias, alias type, confidence, review state, created/updated actor IDs, and timestamps

#### Scenario: Scoped uniqueness is enforced
- **WHEN** two products or aliases are created in the same tenant/team with the same normalized model or normalized alias
- **THEN** the database and repository prevent the duplicate while allowing the same normalized value in a different team scope

### Requirement: Repository creates validated scoped racket products
The project SHALL provide a server-only repository method that creates a racket product and optional aliases after validating input, computing normalized fields, checking required permissions, and assigning tenant/team and actor audit metadata from the authorized data access context.

#### Scenario: Product is created
- **WHEN** an authorized actor with `manage_products` creates a racket product with valid brand, model, specifications, positioning, and aliases
- **THEN** the repository persists the product and aliases under the actor's tenant/team scope and returns a product view with aliases and downstream readiness

#### Scenario: Product is missing sources
- **WHEN** an authorized actor creates a product without reviewed source references
- **THEN** the repository stores the product in a non-published state and downstream readiness reports source or publication blockers instead of making it AI/Q&A ready

#### Scenario: Invalid product input is submitted
- **WHEN** required fields are empty, arrays exceed configured limits, enum values are invalid, or strings exceed configured lengths
- **THEN** the repository rejects the input with a structured validation error and no persistence side effect

#### Scenario: Actor lacks product permission
- **WHEN** a data access context without `manage_products` attempts to create a racket product
- **THEN** the repository rejects the operation before writing product or alias records

### Requirement: Repository prevents duplicate models and alias conflicts
The project SHALL prevent duplicate racket model records and alias conflicts within the same tenant/team scope before product data can be reused by downstream workflows.

#### Scenario: Duplicate model is submitted
- **WHEN** an actor creates a product whose normalized model already exists in the same tenant/team
- **THEN** the repository rejects the command with a duplicate-model error and does not create a second product

#### Scenario: Alias belongs to another product
- **WHEN** an actor creates a product with an alias whose normalized alias is already linked to another product in the same tenant/team
- **THEN** the repository rejects the command with an alias-conflict error and does not create a second product

#### Scenario: Same model exists in another team
- **WHEN** an actor in a different authorized team creates the same normalized model or alias
- **THEN** the repository permits the record because tenant/team ownership scopes uniqueness

### Requirement: Repository lists tenant/team scoped racket product views
The project SHALL provide a server-only repository query that lists racket product views only within the authorized tenant/team scope, supports bounded pagination and optional filters, and includes aliases and downstream readiness in each returned view.

#### Scenario: Products are listed
- **WHEN** an actor with `read_workspace` or `manage_products` lists racket products
- **THEN** the repository returns only records from the actor's authorized tenant/team with aliases and readiness fields

#### Scenario: Cross-team records exist
- **WHEN** another team has racket products with matching model names or aliases
- **THEN** the list query does not return those records to the current actor's team scope

#### Scenario: Pagination limit is too large
- **WHEN** a list query asks for more than the configured maximum number of records
- **THEN** validation rejects the query before database access

### Requirement: Racket persistence verification is repeatable
The project SHALL include a repeatable local verification script for racket product persistence that uses the local PostgreSQL database, runs inside rollback transactions for test data, and proves repository behavior without changing public UI behavior.

#### Scenario: Local check passes
- **WHEN** local PostgreSQL is migrated and `pnpm rackets:check` runs with a valid `DATABASE_URL`
- **THEN** it verifies successful create/list, duplicate model rejection, alias conflict rejection, missing permission rejection, cross-team isolation, and transaction rollback

#### Scenario: Existing checks still pass
- **WHEN** the racket persistence implementation is completed
- **THEN** existing lint, typecheck, build, data foundation check, and auth guard check remain passing
