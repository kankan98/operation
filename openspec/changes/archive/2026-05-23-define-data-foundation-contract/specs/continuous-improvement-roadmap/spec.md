## ADDED Requirements

### Requirement: Data foundation contract precedes database runtime
The autonomous development roadmap SHALL treat the `data-foundation` contract
as a prerequisite before future PostgreSQL services, Drizzle schema,
migrations, repositories, tenant-scoped persistence, API persistence, or
Server Action persistence.

#### Scenario: Database runtime wave is selected
- **WHEN** a future roadmap wave selects persistent products, sessions,
  knowledge, AI review runs, Q&A answers, talk tracks, next-session tasks,
  feedback, exports, source reviews, or audit records
- **THEN** the wave starts from `docs/contracts/data-foundation.md`,
  `docs/contracts/auth-team-tenant.md`, the technical blueprint, and the
  relevant workflow contract before creating runtime database code

#### Scenario: Roadmap orders persistence
- **WHEN** the roadmap orders future runtime work
- **THEN** data foundation is sequenced before workflow persistence, AI/RAG
  runtime, feedback learning, exports, and external integrations that need
  stable protected record IDs
