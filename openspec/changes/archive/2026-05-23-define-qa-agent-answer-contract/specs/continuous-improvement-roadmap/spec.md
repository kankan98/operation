## ADDED Requirements

### Requirement: Q&A answer contract precedes Q&A runtime
The autonomous development roadmap SHALL treat the `qa-agent-answer` contract
as a prerequisite for future Q&A Agent provider calls, RAG retrieval, answer
persistence, feedback learning, missing-knowledge routing, web discovery, and
knowledge lifecycle integration.

#### Scenario: Q&A runtime implementation is selected
- **WHEN** a future roadmap wave selects real Q&A answer generation, retrieval,
  persistence, feedback capture, web discovery, evaluation, or source review
- **THEN** the wave starts from `docs/contracts/qa-agent-answer.md` and updates
  it if schema, prompt version, provider metadata, retrieval snapshot,
  authorization, sensitive data, feedback, discovery, or verification
  assumptions change

#### Scenario: Q&A contract is completed
- **WHEN** the Q&A answer contract draft is written
- **THEN** the roadmap treats it as the governing input for the later Q&A Agent
  runtime rather than allowing UI components to call providers, vector stores,
  databases, or public search directly

#### Scenario: Q&A roadmap is sequenced
- **WHEN** the roadmap orders future Q&A work
- **THEN** reviewed-knowledge-only answers, feedback capture,
  missing-knowledge detection, web discovery review-only findings, knowledge
  lifecycle promotion, and evaluation are sequenced as governed stages rather
  than one autonomous self-learning release
