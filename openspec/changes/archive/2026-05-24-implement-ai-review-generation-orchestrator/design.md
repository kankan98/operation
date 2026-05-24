## Context

The project has already accepted and partially implemented three prerequisites:

- A local AI review run ledger under `apps/web/src/server/ai-review/repository.ts`.
- A server-only `AiProviderPort` plus DeepSeek adapter under
  `apps/web/src/server/ai-provider/`.
- AI review contracts that require bounded snapshots, prompt version metadata,
  structured output validation, provider failure states, human review, and no
  secret or full prompt logging.

The missing piece is the AI layer between repository state and provider calls.
Without it, future work would be tempted to assemble prompts directly inside a
route handler, repository verifier, or UI component. That would blur the
project's UI/domain/data/AI boundaries and make prompt safety, output validation,
and provider failure mapping harder to test.

This change belongs to technical roadmap stage 5: AI review MVP. It consumes
stage 3 local persistence and the completed provider gate, but it does not
advance to stage 6 RAG or stage 9 queueing/production integration.

## Goals / Non-Goals

**Goals:**

- Add a server-only AI review generation orchestrator as the first runtime
  consumer of `AiProviderPort`.
- Keep prompt composition, provider invocation, output schema validation, local
  validation, and safe error mapping in the AI layer.
- Use bounded redacted session snapshots and reviewed knowledge snapshots only.
- Produce structured AI review output sections that can be handed to the
  existing local repository after validation.
- Provide a fake-provider verifier that exercises success and failure paths
  without a real DeepSeek key or live provider call.
- Update durable docs/specs so future UI/API/persistence work starts from the
  orchestrator boundary.

**Non-Goals:**

- No public Route Handler, Server Action, browser save flow, or UI generation
  action.
- No new database tables, migrations, queue, object storage, observability
  provider, RAG retrieval, pgvector embeddings, or source discovery.
- No live DeepSeek smoke in the default check.
- No storage of full prompts, raw transcripts, customer PII, orders, full
  provider request/response bodies, or secrets.
- No automatic publication of AI suggestions into talk tracks, short-video
  topics, tasks, or authoritative knowledge.

## Decisions

### 1. Implement a focused `generation.ts` service instead of expanding the repository

The orchestrator will live under `apps/web/src/server/ai-review/generation.ts`.
It will own:

- Public service function such as `generateAiReview`.
- Input and output Zod schemas.
- Prompt message construction.
- Provider error to AI review error mapping.
- Local validation result generation.

The repository will remain responsible for persistence, state transitions, and
tenant/team scoped writes. A future domain workflow can call the orchestrator and
then call repository methods in order, but this change will keep those concerns
separable.

Alternative considered: add a `runGeneration` method to the repository. Rejected
because prompt building and provider invocation are AI-layer behavior, not data
access behavior.

### 2. Use the existing `AiProviderPort`; do not add an SDK or provider-specific prompt path

The orchestrator will accept an injected `AiProviderPort`. Tests and the local
verifier will use a fake provider. Production construction can later use
`createDeepSeekProvider(parseDeepSeekProviderEnv())`, but that wiring remains
outside this change.

Alternative considered: import the DeepSeek adapter directly. Rejected because
it would make AI review generation provider-specific and weaken the accepted
provider-neutral boundary.

### 3. Model input as bounded snapshots, not raw live transcripts

The orchestrator input will mirror the existing AI review run contract:

- `sessionId`, `requestedSections`, and prompt metadata.
- `inputSnapshot` with redaction state, long-input policy, operator summary,
  question summaries, objection summaries, product order, and note highlights.
- `knowledgeSnapshot` with reviewed source IDs, knowledge version IDs, product
  version IDs, freshness, conflict, review state, trust summary, and intended
  use.

Before provider invocation, the service will block unsafe input states:

- `redactionState` of `needs_review` or `blocked`.
- `longInputPolicy` of `blocked`.
- stale-blocked, conflict-blocked, insufficient, or empty reviewed knowledge.
- missing useful session summary and section source material.

This follows the context-engineering decision that the model receives only the
context needed for the review decision.

### 4. Validate output twice: schema first, product validation second

The provider returns data only after the existing port validates the top-level
Zod schema. The orchestrator then adds AI review-specific validation:

- Required requested section types are present when source material exists.
- Section title and summary are non-empty.
- `sourceRefs` are present for operational recommendations.
- No obvious sensitive markers appear in generated title, summary, or item text.
- Stale/conflict warnings become validation warnings rather than usable facts.
- Low evidence produces warnings and low/unknown confidence, not invented facts.

Validation results will use the same check types as the local AI review run
ledger: `schema`, `empty_section`, `source_grounding`, `stale_source`,
`sensitive_data`, `fact_conflict`, `long_input`, and `policy`.

Alternative considered: rely only on provider schema validation. Rejected because
JSON schema conformance does not prove the output is grounded, non-sensitive, or
safe for review.

### 5. Keep prompt details traceable without exposing full prompt content

The service result will include safe metadata:

- `promptVersion` and prompt schema versions.
- `promptFingerprint`, generated with Node's built-in crypto hash over the
  constructed messages.
- Provider metadata from `AiProviderPort`.
- Validation results and section count.

It will not return or log full prompt content. The local verifier will assert
that serialized errors do not leak synthetic secrets, bearer headers, full
prompt text, or raw provider content.

Alternative considered: return prompt messages for debugging. Rejected because
prompt templates and session notes are sensitive business context.

### 6. Add one verifier command before implementation

TDD will start with `apps/web/src/server/ai-review/generation-check.ts` and a
root/package script `ai-review:generation-check`. The first run must fail
because `generation.ts` does not exist yet. Then the implementation will be
added until the verifier passes.

The verifier will cover:

- Happy path with all seven section types.
- Blocked redaction, blocked long input, insufficient knowledge, and empty
  session signal.
- Provider timeout, rate limit, refusal, partial output, malformed JSON, and
  schema mismatch as safe mapped failures.
- Sensitive output and weak grounding validation.
- Prompt fingerprint and provider metadata are present, while secrets and full
  prompts are not leaked.

## Risks / Trade-offs

- AI output may still be low quality even when structured correctly -> The
  service only creates reviewable suggestions and validation warnings; future
  prompt/model changes require representative evaluation.
- Prompt schema may duplicate some repository shape -> The duplication is
  intentional for the AI boundary. Shared abstractions can be extracted only if
  repetition becomes stable across repository, API, and AI modules.
- Local fake-provider verification cannot prove real DeepSeek quality -> It
  proves orchestration, validation, and failure handling. Live smoke remains
  explicit and separate because credentials and spend are sensitive.
- Synchronous generation may not scale for production -> This change is local
  server-only. Queue/retry/dead-letter behavior remains a later stage once the
  end-to-end workflow needs it.
- No RAG means knowledge selection is caller-provided -> That matches the
  current stage. Retrieval and pgvector snapshots remain stage 6.

## Migration Plan

1. Add the failing generation verifier and package scripts.
2. Implement the orchestrator with fake-provider tests.
3. Update contracts, specs, architecture notes, README, and roadmaps.
4. Run OpenSpec and local verification.
5. Archive after verification passes.

Rollback is file-scoped: remove `generation.ts`, `generation-check.ts`, package
scripts, and the related docs/spec updates. No database migration or persistent
data cleanup is required.

## Open Questions

- The first production prompt wording remains a quality and evaluation concern.
  This change defines the boundary and schema, not a final prompt optimization.
- Future UI/API orchestration must decide whether generation is synchronous,
  queued, or both after authentication and public save flows exist.
