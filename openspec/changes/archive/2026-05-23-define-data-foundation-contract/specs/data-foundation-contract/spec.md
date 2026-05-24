## ADDED Requirements

### Requirement: Data foundation contract exists
The project SHALL provide a `data-foundation` contract draft before
implementing PostgreSQL services, Drizzle schema, migrations, repositories,
tenant-scoped persistent records, API persistence, or Server Action persistence.

#### Scenario: Future data runtime work is proposed
- **WHEN** a future change proposes database connections, schema files,
  migrations, repositories, persisted protected records, or data-backed APIs
- **THEN** the agent starts from `docs/contracts/data-foundation.md` and updates
  it if schema, migration, validation, transaction, authorization, audit, or
  sensitive-data assumptions change

#### Scenario: Contract is read
- **WHEN** an agent opens the data foundation contract
- **THEN** it can identify current status, runtime boundary, use case, stage
  gates, domain entities, command/query shapes, state machines, error cases,
  authorization rules, sensitive data handling, audit metadata, verification,
  and open questions

### Requirement: Protected records carry tenant team ownership and audit fields
The data foundation contract SHALL require every protected persisted business
record to include tenant/team ownership, actor audit metadata, timestamps, and
archive or deletion state unless the record is explicitly documented as public.

#### Scenario: Protected record is created
- **WHEN** a future repository creates product, session, knowledge, AI review,
  Q&A, talk-track, next-task, feedback, source, export, or audit-adjacent data
- **THEN** the write includes tenant ID, team ID, actor ID, creation/update
  timestamps, authorization scope, and audit metadata appropriate to the record

#### Scenario: Record is public reference data
- **WHEN** a future record omits tenant/team ownership because it is intended to
  be shared public reference data
- **THEN** the schema and OpenSpec design explicitly document public visibility,
  source trust, review state, and why protected ownership is not required

### Requirement: Repository layer owns data access
The data foundation contract SHALL require future database reads and writes to
go through repository boundaries that enforce validation, tenant/team scope,
transactions, pagination, idempotency, and audit semantics.

#### Scenario: UI needs persisted data
- **WHEN** a future UI, page, or component needs saved business data
- **THEN** it obtains a view model through application-owned route handlers,
  thin Server Actions, or services rather than direct SQL/ORM access

#### Scenario: Repository operation runs
- **WHEN** a future repository command or query executes against protected data
- **THEN** it receives an authenticated authorization context, tenant/team
  scope, request ID, validated input, and records audit or authorization
  metadata as required by the operation

### Requirement: Migrations and validation are explicit
The data foundation contract SHALL require future data runtime work to define
Drizzle migration strategy and runtime schema validation before persisted data
is accepted or returned.

#### Scenario: Migration is added
- **WHEN** a future change adds or modifies a database table, index, enum,
  constraint, relationship, or extension
- **THEN** it includes a reviewed migration, rollback or recovery notes,
  repeatability verification, and affected repository/test updates

#### Scenario: Runtime input is received
- **WHEN** future API, Server Action, import, AI output, or integration payload
  data enters the system
- **THEN** it is validated against an explicit schema before persistence or
  downstream use

### Requirement: Data foundation protects sensitive records and logs
The data foundation contract SHALL classify live transcripts, customer
questions, operational notes, pricing strategy, source extractions, prompts,
AI outputs, provider metadata, and audit events as sensitive unless explicitly
documented otherwise.

#### Scenario: Repository or migration logs an event
- **WHEN** future data access, migration, import, AI run, or repository failure
  is logged
- **THEN** logs avoid raw secrets, full prompts, full transcripts, customer
  personal data, and unnecessary protected payloads while preserving request or
  record IDs for debugging

#### Scenario: Long text is persisted
- **WHEN** future runtime persists notes, transcripts, source extracts,
  generated AI output, or free-form operator text
- **THEN** the design defines length limits, truncation or rejection behavior,
  storage location, sensitivity, audit references, and verification cases
