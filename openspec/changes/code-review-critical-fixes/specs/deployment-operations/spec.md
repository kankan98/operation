## ADDED Requirements

### Requirement: Runtime database migrations match backend schema
The system SHALL keep database schema changes required by backend runtime code in the migration directory executed by the configured backend migration command.

#### Scenario: Backend schema columns are deployable
- **WHEN** backend code reads or writes a database column
- **THEN** the runtime migration path used by `pnpm -C backend db:migrate` SHALL contain migrations that create that column

#### Scenario: Migration source is not split
- **WHEN** a database schema change is added
- **THEN** it SHALL NOT exist only in an unused migration folder while the configured runtime migrator points elsewhere
