## ADDED Requirements

### Requirement: Auth guard foundation precedes protected workflow persistence
The autonomous development roadmap SHALL treat provider-neutral auth guard
foundation as the current prerequisite before product, session, knowledge, AI
review, Q&A, talk-track, next-session task, feedback, export, source-review, or
RAG persistence work proceeds.

#### Scenario: Workflow persistence is selected
- **WHEN** a future roadmap wave selects persistent product, session,
  knowledge, AI review, Q&A, talk-track, next-session task, feedback, export,
  source-review, or RAG snapshot work
- **THEN** the wave starts from the implemented auth guard foundation, the data
  foundation runtime, and the relevant workflow contract before adding
  protected database tables or route handlers

#### Scenario: Roadmap is reviewed after this wave
- **WHEN** this local auth guard foundation is completed and verified
- **THEN** the roadmap marks stage-2 auth guard as partially implemented and
  keeps login provider runtime, invitation UI, protected workflow CRUD, AI
  runtime, Q&A runtime, and production auth provider selection as separate later
  OpenSpec work
