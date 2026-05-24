## ADDED Requirements

### Requirement: Next-session task contract gates task architecture
The technical architecture SHALL require a `next-session-task` contract before
next-session task persistence, task repositories, task APIs, Server Actions,
AI-generated task creation, task feedback learning, task exports, or task
reporting is implemented.

#### Scenario: Next-session task runtime is proposed
- **WHEN** a future OpenSpec change proposes task APIs, repositories, database
  tables, Server Actions, AI downstream creation, checklist records,
  dependencies, exports, reporting, or feedback records
- **THEN** the design starts from `docs/contracts/next-session-task.md`,
  records source provenance, ownership, state transitions, authorization,
  sensitive data, audit, rollback, and verification before adding runtime code

#### Scenario: AI output is reused as a task
- **WHEN** a future AI review output is proposed for reuse as a next-session
  task
- **THEN** the implementation treats it as a downstream candidate until source
  readiness, validation, authorization, duplicate detection, and acceptance
  rules create or update an owned task record
