## ADDED Requirements

### Requirement: Data foundation contract gates database architecture
The technical architecture SHALL require a `data-foundation` contract before
PostgreSQL services, Drizzle schema, migrations, repositories, protected
persistent records, API persistence, or Server Action persistence are
implemented.

#### Scenario: Database schema is proposed
- **WHEN** a future OpenSpec change proposes Drizzle schema, database
  migrations, PostgreSQL extensions, indexes, constraints, or persistent
  domain tables
- **THEN** the design starts from `docs/contracts/data-foundation.md`, records
  tenant/team ownership, validation, migration, transaction, audit, rollback,
  and verification requirements before adding runtime code

#### Scenario: Repository boundary is proposed
- **WHEN** a future change proposes repository methods for protected business
  data
- **THEN** the implementation receives project-owned auth context and validated
  input, enforces tenant/team scope server-side, and hides SQL/ORM details from
  UI and domain rendering code

#### Scenario: Database dependency is introduced
- **WHEN** a future change installs Drizzle, Zod, PostgreSQL drivers, migration
  tools, or related database dependencies
- **THEN** the OpenSpec design records dependency rationale, alternatives,
  maintenance and license risk, runtime impact, failure modes, rollback path,
  and verification commands
