# data-foundation-runtime Specification

## Purpose
Define the local-only stage-3 data foundation runtime for PostgreSQL, Drizzle
migrations, Zod validation, server-only database access, tenant/team-scoped
repository primitives, audit/idempotency records, safe errors, and repeatable
local verification before protected workflow persistence is introduced.

## Requirements
### Requirement: Data foundation runtime is local-only and non-user-facing
The project SHALL implement the first data foundation runtime as a local-only
stage-3 foundation that does not expose protected business persistence through
public UI pages, API routes, or Server Actions.

#### Scenario: Static public page renders without database config
- **WHEN** the application renders existing public/static workspace pages
  without `DATABASE_URL`
- **THEN** those pages continue to render from static data and do not attempt a
  database connection

#### Scenario: Database script runs without config
- **WHEN** a database migration, introspection, repository check, or data
  verification script runs without required local database configuration
- **THEN** it fails closed with a redacted, actionable error and does not fall
  back to in-memory or unscoped persistence

### Requirement: Drizzle PostgreSQL migrations are configured
The project SHALL provide Drizzle/PostgreSQL configuration, package scripts, and
checked-in migration artifacts for the local data foundation runtime.

#### Scenario: Migration is generated
- **WHEN** the schema changes during the implementation
- **THEN** a Drizzle migration is generated, reviewed, checked in, and tied to
  the affected schema and repository verification

#### Scenario: Migration is applied locally
- **WHEN** a developer or agent runs the documented local migration command
  with a valid local PostgreSQL database
- **THEN** the schema is applied repeatably without requiring a production
  database provider or public preview deployment

### Requirement: Base schema provides ownership audit and idempotency primitives
The data foundation runtime SHALL define base schema primitives for tenants,
teams, app users, tenant memberships, team memberships, audit events, and
idempotency records before workflow-specific protected tables are introduced.

#### Scenario: Protected ownership primitive is created
- **WHEN** the first data foundation migration is reviewed
- **THEN** tenant/team/user/membership tables include stable IDs, status fields,
  timestamps, and indexes needed for tenant/team-scoped future queries

#### Scenario: Audit or idempotency record is created
- **WHEN** future repository helpers create audit or idempotency records
- **THEN** those records include request ID, actor ID, tenant/team scope, target
  type, target ID where applicable, status, timestamps, and redacted metadata

### Requirement: Database access is server-only and repository-scoped
The data foundation runtime SHALL keep all database clients and repository
helpers in server-only modules and prevent UI/page/component code from directly
using Drizzle, SQL clients, or migration utilities.

#### Scenario: Repository command executes
- **WHEN** a repository command writes protected or audit-adjacent data
- **THEN** it receives an explicit data/auth context, validated input, request
  ID, tenant/team scope, and transaction or idempotency options where required

#### Scenario: UI needs saved data later
- **WHEN** a future UI surface needs persisted data
- **THEN** it must use a route handler, thin Server Action, or service that
  calls repository helpers rather than importing database modules directly

### Requirement: Validation and safe errors are implemented
The data foundation runtime SHALL validate environment variables and repository
command/query inputs with explicit schemas and return redacted errors that do
not expose secrets, SQL internals, prompts, transcripts, or customer data.

#### Scenario: Invalid repository input is received
- **WHEN** repository input fails validation
- **THEN** the command returns or throws a structured validation error with
  field-level information and no persistence side effect

#### Scenario: Database operation fails
- **WHEN** a database operation fails due to connection, constraint,
  transaction, idempotency, or migration error
- **THEN** the surfaced error includes request or operation metadata sufficient
  for debugging without leaking database URLs, credentials, raw payloads, or
  sensitive business data

### Requirement: Tenant team scope is enforced by repository primitives
The data foundation runtime SHALL enforce tenant/team scope at the repository
boundary even before row-level security is introduced as database
defense-in-depth.

#### Scenario: Tenant-scoped query runs
- **WHEN** a repository query reads tenant/team-scoped data
- **THEN** it filters by authorized tenant/team scope and does not trust
  client-provided tenant or team selectors

#### Scenario: RLS is considered
- **WHEN** a future change proposes row-level security policies
- **THEN** it starts from the existing tenant/team columns, indexes, and
  repository tests, and it adds policy verification before claiming RLS
  protection

### Requirement: Data runtime verification is repeatable
The data foundation runtime SHALL include verification that proves package,
schema, migration, validation, server-only boundary, and repository primitives
work without changing public UI behavior.

#### Scenario: Change is verified
- **WHEN** the data foundation runtime implementation is completed
- **THEN** verification includes OpenSpec validation, package lockfile update,
  lint, typecheck, build, migration generation or repeatability check,
  repository/schema checks against local PostgreSQL when available, and
  sensitive-log/redaction checks

#### Scenario: Local PostgreSQL is unavailable
- **WHEN** local PostgreSQL is unavailable in the current environment
- **THEN** the final report identifies which DB integration checks were skipped,
  which non-DB checks still passed, and what command should be rerun when the
  service is available
