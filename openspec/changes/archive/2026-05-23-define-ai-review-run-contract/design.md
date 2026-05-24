## Context

The project has a static `/ai-review` workbench and three prerequisite contract
drafts:

- `session-capture`: defines the future live-session snapshot and AI review
  input boundary.
- `racket-product-library`: defines reviewed racket product facts and AI/RAG
  readiness.
- `knowledge-lifecycle`: defines reviewed knowledge, provenance, refresh,
  conflict, and feedback boundaries.

The next coherent wave is an `ai-review-run` contract. This keeps the product
moving toward real AI review while preserving the current architecture rule:
UI must not call an LLM, vector store, database, or external search directly.

Research and skill exploration affected the design:

- NIST AI RMF influenced explicit run states, validation, human oversight,
  transparency, and audit metadata.
- OWASP LLM Top 10 influenced sensitive data, prompt injection, poisoned
  knowledge, malformed output, provider errors, and output handling controls.
- W3C PROV-O influenced input snapshot, knowledge snapshot, prompt version,
  provider response, and reviewer decision provenance.
- OpenAI platform docs were checked because the roadmap prefers the Responses
  API with structured outputs, but this contract remains provider-port based.
- Next.js official App Router and Route Handler documentation, Drizzle ORM
  PostgreSQL migration documentation, and pgvector's official project
  documentation were checked to keep the staged technology outline aligned with
  the accepted stack instead of inventing a separate backend path.
- `context-engineering-advisor` pushed the contract toward bounded snapshots
  instead of raw transcript or broad context stuffing.
- `recommendation-canvas` kept the scope tied to operator outcomes: editable
  recap, diagnosis, talk-track candidates, short-video topics, and next tasks.

## Goals / Non-Goals

**Goals:**

- Define the future AI review run boundary before runtime implementation.
- Preserve domain language for live sessions, racket facts, knowledge versions,
  talk tracks, objections, customer questions, and next-session actions.
- Define structured inputs, outputs, run states, validation results, human
  review decisions, feedback, and downstream artifact handoff.
- Make AI output auditable: which session snapshot, knowledge snapshot, prompt
  version, provider metadata, validation checks, and reviewer decisions produced
  a suggestion.
- Define failure and retry/regeneration behavior before provider calls exist.
- Keep the contract compatible with `AiProviderPort` and future provider
  replacement.
- Add a staged technical implementation roadmap that defines which technology
  boundary is expected in each phase, what result that phase should achieve, and
  which decisions remain deferred behind future OpenSpec changes.

**Non-Goals:**

- No API route, Server Action, database table, migration, queue, provider SDK,
  prompt template, or model call.
- No UI changes and no change to public preview behavior.
- No final provider selection beyond respecting the existing `AiProviderPort`
  boundary and preferred OpenAI-first architecture.
- No automatic publishing of AI output to product facts, knowledge records,
  talk tracks, or tasks without human review.
- No web discovery or RAG indexing implementation.
- No immediate selection of auth provider, queue provider, object storage
  vendor, analytics vendor, production hosting provider, or observability
  vendor beyond defining the stage gates and adapter boundaries.

## Decisions

### Decision 1: Contract-first AI run boundary

The contract will describe commands, queries, state machine, shapes, errors,
authorization, sensitive data, audit metadata, and verification before any
runtime AI call. This mirrors the existing product, session, and knowledge
contracts and reduces the chance of UI-to-provider coupling.

Alternatives considered:

- Implement a fake provider first: would create code paths before the contract
  clarifies input and output authority.
- Add only frontend copy: insufficient because the next risk is backend/AI
  boundary, not visual explanation.

### Decision 2: Bounded snapshots, not raw context stuffing

An AI review run will consume a `SessionReviewInputSnapshot` and
`AiReviewKnowledgeSnapshot`. These snapshots must be minimal, tenant-scoped,
review-state aware, and redacted. They should reference source and version IDs
instead of copying full transcripts, private messages, or broad knowledge dumps.

Alternatives considered:

- Send the full session record and all related knowledge to the provider: easier
  initially, but increases cost, sensitive-data exposure, hallucination risk,
  and context noise.
- Store only a prompt string: loses provenance and makes later review,
  regeneration, and evaluation weak.

### Decision 3: Structured output with validation before persistence or reuse

The contract will define structured output sections for live recap, product
diagnosis, question clusters, objection patterns, talk-track candidates,
short-video topics, and next-session action drafts. Output must pass schema and
quality validation before it can enter reviewable suggestions.

Alternatives considered:

- Store raw model text and parse later: faster but fragile and hard to audit.
- Let the model decide arbitrary sections: flexible but inconsistent with the
  current `/ai-review` workbench and downstream workflows.

### Decision 4: Human review controls downstream reuse

AI suggestions are not authoritative facts. Operators or reviewers must accept,
edit, reject, or regenerate suggestions before downstream artifacts are created
or feedback affects learning queues.

Alternatives considered:

- Auto-create talk tracks and tasks: convenient but violates current guardrails
  around AI output authority.
- Require admin review for every suggestion: too restrictive for low-risk
  operational drafts; role-based review states are enough at contract level.

### Decision 5: Failures are first-class run states

Provider timeout, refusal, rate limit, schema mismatch, stale knowledge,
insufficient evidence, long input, sensitive data, unauthorized access, and
partial output are represented as explicit states or error codes. This makes
the future UI and API recoverable rather than hiding failures behind generic
messages.

Alternatives considered:

- Collapse failures into `failed`: simpler but loses recovery guidance.
- Retry automatically without recording reason: risks repeated bad output and
  weak auditability.

### Decision 6: Add a staged technical roadmap before more runtime work

The project will add `docs/architecture/technical-implementation-roadmap.md` as
the technical outline future runtime work must check before introducing auth,
data persistence, AI provider calls, RAG, source discovery, queues, object
storage, external integrations, deployment infrastructure, or observability.

The roadmap will separate:

- accepted choices already in the specs, such as Next.js App Router, Route
  Handlers as reusable API boundaries, PostgreSQL with Drizzle, PostgreSQL +
  pgvector for RAG MVP, and OpenAI Responses API behind `AiProviderPort`;
- deferred choices that need later OpenSpec decisions, such as auth provider,
  queue provider, object storage, analytics, and production deployment target;
- phase outcomes, so each stage has a user-visible or engineering-visible result
  rather than just installing technology.

Alternatives considered:

- Choose every vendor now: too early because auth, queue, storage, analytics,
  deployment, and external integrations still need account, cost, security, and
  operational decisions.
- Leave the technology plan implicit in scattered specs: too easy for future
  agents to drift, duplicate abstractions, or introduce provider-specific code
  without a rollback path.

## Risks / Trade-offs

- The contract may become too detailed before runtime implementation -> Keep it
  as a draft and require future implementation changes to update the contract.
- Provider capabilities may change -> Use provider-neutral shapes and place
  provider-specific behavior behind `AiProviderPort`.
- Bounded snapshots may omit useful context -> Add blocked/insufficient evidence
  states and allow reviewers to request more source material.
- Feedback could be mistaken for knowledge truth -> Route feedback to review
  queues or evaluation inputs, not directly to authoritative knowledge.
- Regeneration could erase audit history -> Treat every regeneration as a new
  run or child attempt with parent run metadata.
- A staged roadmap could feel like premature architecture -> Keep it as
  decision guidance and phase gates; do not create runtime directories,
  services, dependencies, or providers until a future OpenSpec change implements
  a specific stage.

## Migration Plan

1. Add `docs/contracts/ai-review-run.md`.
2. Add `docs/architecture/technical-implementation-roadmap.md`.
3. Update contract index and roadmap/goal notes.
4. Validate OpenSpec and markdown.
5. Archive the change when complete.

Rollback is documentation-only: revert the contract and spec additions. No
runtime data or deployed behavior changes.

## Open Questions

- Whether first runtime implementation uses Route Handler, Server Action wrapper,
  or a domain service invoked behind both.
- Exact prompt version naming and storage scheme.
- Whether review decisions require a dedicated reviewer role or can begin with
  operator-level review for drafts.
- How feedback signals become evaluation examples versus knowledge lifecycle
  review priorities.
- Exact auth provider, queue provider, object storage vendor, analytics vendor,
  observability stack, and production deployment target.
