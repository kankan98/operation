## ADDED Requirements

### Requirement: Data foundation contract records runtime status
The data foundation contract SHALL be updated when local stage-3 database
runtime is implemented so future agents can distinguish contract-only planning
from partially implemented local runtime.

#### Scenario: Local runtime is implemented
- **WHEN** the project adds Drizzle configuration, PostgreSQL schema,
  migrations, validation, server-only database modules, and repository
  primitives
- **THEN** `docs/contracts/data-foundation.md` records the implemented local
  runtime surface, the remaining non-goals, and the fact that user-facing
  workflow persistence remains blocked until future OpenSpec changes

#### Scenario: Future workflow persistence is selected
- **WHEN** a future change implements product, session, knowledge, AI review,
  Q&A, talk-track, next-session task, feedback, export, or source-review
  persistence
- **THEN** the agent starts from the updated data foundation contract and
  updates it if schema, repository, validation, authorization, audit,
  idempotency, or sensitive-data assumptions change
