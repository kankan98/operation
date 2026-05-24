## ADDED Requirements

### Requirement: Next-session task contract precedes task runtime
The autonomous development roadmap SHALL treat the `next-session-task` contract
as a prerequisite before future next-session task persistence, AI review
downstream creation, session follow-up planning, reviewer closure, feedback
learning, task reporting, export, or notification workflows.

#### Scenario: Next-session task implementation is selected
- **WHEN** a future roadmap wave selects task create, assign, checklist,
  complete, block, review, archive, search, AI downstream creation, feedback
  learning, report, export, or notification work
- **THEN** the wave starts from `docs/contracts/next-session-task.md`,
  `docs/contracts/ai-review-run.md`, `docs/contracts/session-capture.md`,
  `docs/contracts/data-foundation.md`, and the relevant product, knowledge, and
  talk-track contracts before runtime code

#### Scenario: Roadmap orders next-session work
- **WHEN** the roadmap orders future AI review, session follow-up, talk-track
  reuse, knowledge-gap handling, Q&A, feedback, or reporting work
- **THEN** next-session tasks are sequenced as owned operational records rather
  than letting AI-generated recommendations become unassigned team obligations
  directly
