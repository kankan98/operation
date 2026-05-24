## ADDED Requirements

### Requirement: Autonomous runtime waves follow the technical blueprint
The autonomous development roadmap SHALL require future backend, auth,
database, AI, RAG, source discovery, queue, storage, external integration,
deployment, analytics, observability, or protected-data waves to begin from the
technical blueprint before implementation.

#### Scenario: Runtime wave is selected
- **WHEN** an agent selects a future runtime wave
- **THEN** the agent identifies the technical blueprint stage, prerequisite
  contracts, target operator workflow, expected user or engineering outcome,
  reliable source checks, relevant skill exploration, and verification plan
  before changing runtime code

#### Scenario: Roadmap sequence changes
- **WHEN** user feedback, implementation evidence, verification results, or
  source research shows the current roadmap sequence conflicts with the
  technical blueprint or operator value
- **THEN** the roadmap and blueprint are updated together through OpenSpec
  before the wave proceeds

### Requirement: Data foundation follows technical blueprint sequencing
The autonomous development roadmap SHALL treat data foundation work as the next
runtime-enabling wave only after auth/team/tenant contract boundaries and the
technical blueprint have been checked.

#### Scenario: Data foundation implementation is proposed
- **WHEN** a future change proposes PostgreSQL schema, Drizzle migrations,
  Zod validation, repositories, transactions, audit fields, or tenant/team
  ownership
- **THEN** the design starts from the technical blueprint, the auth/team/tenant
  contract, and the relevant workflow contracts before creating database code

#### Scenario: Data foundation tries to skip authorization scope
- **WHEN** a future data model omits tenant/team ownership, actor audit fields,
  repository boundaries, or authorization assumptions for protected records
- **THEN** the change is not implementation-ready until those requirements are
  added or the blueprint explicitly explains why the record is public
