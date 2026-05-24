## ADDED Requirements

### Requirement: Stage 3 data foundation follows contract gate
The technical blueprint SHALL treat stage 3 data foundation as contract-gated
work that must define PostgreSQL, Drizzle migration, validation, repository,
tenant/team ownership, transaction, idempotency, and audit requirements before
runtime implementation.

#### Scenario: Stage 3 starts
- **WHEN** a future change begins stage 3 implementation
- **THEN** it checks `docs/contracts/data-foundation.md`, the
  `auth-team-tenant` contract, relevant workflow contracts, and accepted
  technical architecture specs before adding database runtime code

#### Scenario: Stage 3 implementation changes scope
- **WHEN** implementation evidence shows a different migration, validation,
  repository, authorization, or audit strategy is needed
- **THEN** the data foundation contract and technical blueprint are updated
  before code proceeds under the changed strategy

#### Scenario: Later stage needs stable records
- **WHEN** future AI, RAG, feedback, source discovery, queue, storage, export,
  or external integration work needs persisted business records
- **THEN** the work depends on stage 3 data foundation or explicitly updates
  the blueprint to explain why a narrower data boundary is safe
