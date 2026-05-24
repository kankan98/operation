## ADDED Requirements

### Requirement: Data foundation runtime precedes workflow persistence
The autonomous development roadmap SHALL treat local stage-3 data foundation
runtime as the current prerequisite before product, session, knowledge, AI
review, Q&A, talk-track, next-session task, feedback, export, source-review, or
RAG persistence work proceeds.

#### Scenario: Workflow persistence is selected
- **WHEN** a future roadmap wave selects persistent product, session,
  knowledge, AI review, Q&A, talk-track, next-session task, feedback, export,
  source-review, or RAG snapshot work
- **THEN** the wave starts from the implemented data foundation runtime, the
  data foundation contract, the auth/team/tenant contract, and the relevant
  workflow contract before adding database tables or repository methods

#### Scenario: Roadmap is reviewed after this wave
- **WHEN** this local data foundation runtime is completed and verified
- **THEN** the roadmap marks stage-3 data foundation as partially implemented
  and keeps auth runtime, protected workflow CRUD, AI runtime, Q&A runtime, and
  production database provider selection as separate later OpenSpec work
