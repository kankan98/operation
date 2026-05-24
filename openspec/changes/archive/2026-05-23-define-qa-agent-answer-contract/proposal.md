## Why

The roadmap has identified Q&A Agent as the next contract-first prerequisite,
but there is not yet a contract for how an operator question becomes a
traceable, reviewed-knowledge-grounded answer with citations, uncertainty,
feedback, missing-knowledge routing, and future web discovery review. Defining
this now prevents the future Q&A implementation from becoming a generic chat box
or coupling UI directly to a model, vector store, web search, or database.

Pre-proposal evidence:

- Reliable sources checked:
  - OpenAI platform documentation for the Responses API and structured outputs
    (`https://platform.openai.com/docs/api-reference/responses`,
    `https://platform.openai.com/docs/guides/structured-outputs`), official
    provider sources, were checked because the project architecture prefers
    OpenAI behind `AiProviderPort` for the first AI implementation while keeping
    provider replacement possible.
  - pgvector official project documentation
    (`https://github.com/pgvector/pgvector`) was checked because the accepted
    Agent architecture prefers PostgreSQL + pgvector for the first RAG MVP.
  - OWASP Top 10 for LLM Applications
    (`https://owasp.org/www-project-top-10-for-large-language-model-applications/`),
    an established security reference, was checked for prompt injection,
    sensitive information disclosure, supply-chain or poisoned knowledge,
    excessive agency, and output handling risks.
  - NIST AI RMF 1.0 (`https://www.nist.gov/itl/ai-risk-management-framework`),
    an official AI risk framework, was checked for transparency, traceability,
    validity, reliability, and risk management expectations around AI-assisted
    decisions.
  - W3C PROV-O (`https://www.w3.org/TR/prov-o/`), a W3C recommendation, was
    checked for provenance patterns around entities, activities, agents,
    attribution, derivation, and generation.
- Relevant skills used:
  - `openspec-explore`: confirmed this should remain a contract and technical
    outline wave, not runtime RAG, AI provider, persistence, or UI work.
  - `recommendation-canvas`: framed the Q&A Agent as valuable only when it helps
    operators answer live-commerce product and operations questions faster while
    preserving evidence, feedback, and review.
  - `context-engineering-advisor`: reinforced that the answer run should retrieve
    narrow reviewed snapshots with intent, not stuff broad product docs,
    transcripts, or raw web pages into the prompt.
  - `roadmap-planning`: kept this wave in Stage 1 before auth, database, AI, RAG,
    web discovery, feedback learning, and production integrations.
- User-value check:
  - Target roles: live operator, host/assistant, product owner, reviewer, and
    team lead.
  - Workflow improved: answering product specs, suitable player levels,打法,
    objection responses, talk-track reuse, and knowledge gaps during preparation
    or post-session review.
  - Expected result: users can ask a practical operations question, see what
    reviewed knowledge supports the answer, understand uncertainty, and turn
    poor answers or missing knowledge into a reviewable improvement signal.
  - Product highlight: a restrained answer ledger that shows citations,
    confidence, unresolved gaps, and feedback route without hiding AI
    assumptions.

## What Changes

- Add a `qa-agent-answer` contract draft under `docs/contracts/` that defines:
  - runtime non-implementation boundary and use case,
  - operator question, intent classification, retrieval snapshot, retrieved
    evidence, answer output, citations, validation result, feedback signals,
    missing-knowledge signals, and web discovery findings,
  - commands, queries, request and response shapes,
  - answer-run state machine and failure/retry behavior,
  - authorization, tenant/team scope, sensitive data handling, audit metadata,
    and verification requirements.
- Update `docs/contracts/README.md` so `qa-agent-answer` moves from planned to
  draft while remaining runtime-not-implemented.
- Update goal and roadmap notes so future Q&A runtime, RAG, feedback learning,
  and web discovery implementation must start from this contract and revise it
  when assumptions change.
- Update the staged technical roadmap so `qa-agent-answer` is treated as a
  completed Stage 1 contract and later runtime stages remain gated.
- Update OpenSpec specs so `qa-agent-answer` is a contract-first prerequisite
  before Q&A provider calls, RAG retrieval, feedback persistence, web discovery,
  or knowledge lifecycle integration.
- No runtime code, UI behavior, package, database, API route, prompt, provider
  call, Docker image, or public preview change is introduced.

## Capabilities

### New Capabilities

- `qa-agent-answer-contract`: Defines the future Q&A Agent answer contract for
  operator questions, intent classification, reviewed retrieval snapshots,
  citations, uncertainty, structured answer output, answer validation, feedback,
  missing knowledge, web discovery review-only findings, authorization,
  sensitive data, audit metadata, and verification.

### Modified Capabilities

- `continuous-improvement-roadmap`: Adds `qa-agent-answer` as a contract-first
  prerequisite before future Q&A runtime, RAG retrieval, provider calls,
  feedback persistence, web discovery, or automatic knowledge improvement.

## Impact

- Affected documentation: `docs/contracts/qa-agent-answer.md`,
  `docs/contracts/README.md`,
  `docs/architecture/technical-implementation-roadmap.md`,
  `docs/roadmap/ai-continuous-development-goal.md`, and
  `docs/roadmap/autonomous-development-roadmap.md`.
- Affected OpenSpec specs after archive: new `qa-agent-answer-contract` and
  updated `continuous-improvement-roadmap`.
- Affected runtime: none.
- Dependencies: none.
- Verification: `openspec validate define-qa-agent-answer-contract`,
  markdown hygiene checks, and `openspec validate --all`. Playwright is skipped
  because this is a contract/documentation change with no rendered UI change.
