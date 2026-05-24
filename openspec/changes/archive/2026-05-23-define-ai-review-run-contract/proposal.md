## Why

The `/ai-review` workbench now previews a structured review workflow, but there
is no contract for the future AI run that will connect session snapshots,
reviewed knowledge, prompt versions, structured outputs, failures, human review,
and feedback. Defining the contract now prevents the next implementation wave
from coupling UI directly to prompts, provider SDKs, persistence, or unreviewed
knowledge.

Pre-proposal evidence:

- Reliable sources checked:
  - NIST AI RMF 1.0, an official AI risk framework, supports explicit validity,
    reliability, transparency, accountability, and risk management expectations
    for AI-assisted workflows.
  - OWASP Top 10 for LLM Applications, an established security reference,
    reinforces prompt injection, sensitive information disclosure, poisoned
    knowledge, model denial, and output handling risks.
  - W3C PROV-O, a W3C recommendation, supports recording provenance across
    entities, activities, agents, derivation, and attribution.
  - OpenAI platform documentation for Responses API and structured outputs was
    checked as the current preferred provider target in the project architecture,
    but the contract remains provider-port based.
  - Next.js official App Router and Route Handler docs, Drizzle ORM PostgreSQL
    migration docs, and pgvector's official project documentation were checked
    to keep the staged technical outline grounded in the current accepted stack.
- Relevant skills used:
  - `openspec-explore`: confirmed this should be a contract-first wave, not a
    runtime AI implementation.
  - `recommendation-canvas`: framed the AI review run as valuable only if it
    reduces operator recap effort, produces editable artifacts, and keeps
    assumptions/failures visible.
  - `context-engineering-advisor`: reinforced that the future run should use a
    bounded session and knowledge snapshot, not raw full transcripts or broad
    context stuffing.
- User-value check:
  - Target roles: live operator, host/assistant, reviewer, and team lead.
  - Workflow improved: turning reviewed session facts into recap, diagnosis,
    talk-track candidates, short-video topics, and next-session tasks.
  - Expected result: operators can review AI suggestions with source and failure
    context, then accept, edit, reject, or regenerate without treating AI output
    as authoritative truth.
  - Product highlight: a clear review ledger that shows what input, knowledge,
    prompt version, model run, and human feedback produced each suggestion.

## What Changes

- Add an `ai-review-run` contract draft under `docs/contracts/` that defines:
  - use case and runtime non-implementation boundary,
  - domain entities for review runs, input snapshots, prompt versions,
    structured outputs, validation results, review decisions, feedback, and
    downstream artifacts,
  - commands, queries, request and response shapes,
  - run state machine and retry/regeneration rules,
  - error cases for empty input, long input, sensitive data, provider timeout,
    refusal, schema mismatch, stale knowledge, and tenant/permission issues,
  - authorization, sensitive data, audit metadata, and verification needs.
- Update `docs/contracts/README.md` so `ai-review-run` moves from planned to
  draft.
- Update roadmap and goal notes so future AI review runtime implementation must
  start from the contract and revise it when assumptions change.
- Add a project-wide technical implementation roadmap under `docs/architecture/`
  that defines staged technology choices, expected outcomes, prerequisites,
  deferred decisions, and guardrails for auth, data, AI, RAG, source discovery,
  feedback learning, integrations, and operations.
- Update OpenSpec specs so `ai-review-run` is treated as a contract-first
  prerequisite before provider calls, prompt execution, persistence, or
  downstream task creation.
- Update technical architecture specs so future runtime waves follow the staged
  technical outline before introducing backend, database, auth, AI, RAG, queue,
  storage, external integration, or deployment infrastructure.
- No runtime code, UI behavior, package, database, API route, prompt, provider
  call, Docker image, or public preview change is introduced.

## Capabilities

### New Capabilities

- `ai-review-run-contract`: Defines the future AI review run contract for
  session inputs, reviewed knowledge snapshots, prompt versions, structured
  outputs, failures, review decisions, feedback signals, downstream artifacts,
  authorization, sensitive data, audit metadata, and verification.

### Modified Capabilities

- `continuous-improvement-roadmap`: Adds `ai-review-run` as a contract-first
  prerequisite before AI review persistence, provider calls, prompt execution,
  feedback learning, talk-track handoff, or next-session task creation.
- `technical-architecture-foundation`: Adds a staged technical implementation
  roadmap requirement so future backend, auth, data, AI, RAG, integration, and
  operations work follows a planned technology sequence instead of ad hoc
  provider or dependency choices.

## Impact

- Affected documentation: `AGENTS.md`, `docs/contracts/ai-review-run.md`,
  `docs/contracts/README.md`, `docs/architecture/technical-implementation-roadmap.md`,
  `docs/architecture/agent-architecture.md`,
  `docs/engineering/code-architecture-standards.md`,
  `docs/roadmap/ai-continuous-development-goal.md`, and
  `docs/roadmap/autonomous-development-roadmap.md`.
- Affected OpenSpec specs after archive: new `ai-review-run-contract` and
  updated `continuous-improvement-roadmap` and
  `technical-architecture-foundation`.
- Affected runtime: none.
- Verification: `openspec validate define-ai-review-run-contract`,
  `openspec validate --all`, and markdown checks. Playwright is skipped because
  this is a contract/documentation change with no rendered UI change.
