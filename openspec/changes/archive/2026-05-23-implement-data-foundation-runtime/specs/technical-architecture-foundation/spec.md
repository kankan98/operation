## ADDED Requirements

### Requirement: Data foundation runtime uses server-only database boundaries
The technical architecture SHALL require local data foundation runtime code to
keep Drizzle, PostgreSQL drivers, migrations, and repository helpers behind
server-only application modules instead of exposing database clients to UI,
page, component, AI, or integration layers.

#### Scenario: Database dependency is added
- **WHEN** `drizzle-orm`, Drizzle tooling, a PostgreSQL driver, Zod, or related
  local data verification tooling is added
- **THEN** the dependency is used only through app-owned server/data modules,
  scripts, or generated migrations and is documented with failure modes,
  rollback, and verification

#### Scenario: Component imports database module
- **WHEN** a UI component, route page, client module, AI module, or integration
  module tries to import the database client, migration utilities, or Drizzle
  schema directly
- **THEN** the implementation is not architecture-complete until the access is
  moved behind a route handler, thin Server Action, domain service, repository,
  or view-model boundary

### Requirement: Data foundation runtime does not imply production database adoption
The technical architecture SHALL keep production database provider, connection
pooling provider, backup, observability, queue, object storage, and deployment
decisions deferred until separate source-backed OpenSpec changes accept them.

#### Scenario: Local runtime exists
- **WHEN** local PostgreSQL schema, migrations, and repository primitives are
  implemented
- **THEN** the architecture still treats managed PostgreSQL hosting,
  production credentials, backups, monitoring, and public preview data
  persistence as not implemented until a later OpenSpec change defines them
