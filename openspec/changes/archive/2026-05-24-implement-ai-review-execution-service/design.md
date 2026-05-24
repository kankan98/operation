## Context

The project is in Stage 5 of the technical roadmap for a local-only AI review MVP. Existing pieces are intentionally separated:

- `AiProviderPort` hides DeepSeek adapter details, credentials, provider-native payloads, and provider errors.
- `generateAiReview` builds bounded prompt messages from redacted session and reviewed knowledge snapshots, validates structured JSON output, and returns safe metadata plus validation results.
- `AiReviewRunRepository` persists the tenant/team-scoped run ledger, provider metadata, structured output, validation results, human decisions, feedback, and downstream references.

The current gap is execution handoff. A prepared run can be started and a generation result can be produced, but no server-only service owns the safe sequence from run ledger to generation and back to persisted review state.

Research and skill conclusions that affect this design:

- DeepSeek official docs reinforce explicit JSON output requests and caller-side validation; provider JSON mode is not treated as trusted product data.
- DeepSeek error behavior, NIST AI RMF, and OWASP LLM guidance support safe failure classification, data minimization, human review, and no prompt/secret/payload leakage.
- JTBD and recommendation-canvas checks confirm the operator value is a reviewable post-live recap that can become talk-track and next-session work after human review, not a raw AI answer.
- Context-engineering check confirms the service should pass only bounded snapshots and prompt metadata, not raw transcripts, entire knowledge stores, or broad session history.

## Goals / Non-Goals

**Goals:**

- Add `executeAiReviewRun` as a server-only AI-layer service.
- Load an existing run detail through the repository using `DataAccessContext`.
- Require the run to be in a safe executable state: `input_ready`, `queued`, or `regeneration_requested`.
- Start the run when needed using an active/reviewed prompt version and provider policy.
- Build generation input from persisted input snapshot, knowledge snapshot, prompt version, requested sections, request ID, and optional generation controls.
- Call `generateAiReview` through an injected `AiProviderPort`.
- Persist successful provider invocation metadata, output sections, validation results, and `review_ready` only when validation has no `failed` or `blocked` result.
- Persist safe provider or validation failure metadata for provider/generation failures without storing partial output as usable suggestions.
- Provide a rollback verifier using a fake provider by default.

**Non-Goals:**

- No public Route Handler, Server Action, UI trigger, browser save flow, or public preview UI change.
- No RAG snapshot generation, pgvector runtime, queue, retry scheduler, object storage, observability provider, or external integration.
- No new database tables, migrations, dependencies, or provider SDK.
- No live DeepSeek request by default, even if credentials are present.
- No automatic downstream talk-track, short-video, or next-session task creation.

## Decisions

### Decision: Keep execution as an AI service, not repository logic

The service will live in `apps/web/src/server/ai-review/execution.ts` and depend on `AiReviewRunRepository`, `AiProviderPort`, and `generateAiReview`.

Alternatives considered:

- Put generation inside the repository. Rejected because repository code should own persistence and state gates, not prompt construction or provider calls.
- Put execution in a route handler. Rejected because public API/auth/session concerns are explicitly out of scope for this wave.
- Add a queue worker. Rejected because Stage 9 queue decisions are intentionally delayed until async runtime is required.

### Decision: Start runs only through existing repository gates

The service will accept `runId`, `promptVersionId`, `providerPolicy`, and `DataAccessContext`. If a run is `input_ready` or `regeneration_requested`, it calls `repository.startRun`. If a run is already `queued`, it uses the existing prompt/provider policy on the run detail. Other states fail before provider invocation.

This preserves existing tenant/team/permission/prompt status checks and avoids introducing a second state machine.

### Decision: Record provider invocation before output handoff

After successful generation, the service records `result.metadata.provider` through `recordProviderInvocation`. The repository moves the run to `validating`, which is the required state for `recordOutput` and `markReviewReady`.

For generation errors:

- Provider-like errors are recorded via provider invocation metadata with a safe `errorCode`, retryability hint, and no full prompt or raw payload.
- Input/evidence/policy errors before provider success are recorded as validation failure where a run is already queued and no provider metadata exists.
- Partial or schema-mismatch output is never persisted through `recordOutput`.

### Decision: Map validation results to persisted section IDs after output insert

Generation validation results identify affected section types, while repository validation rows store affected section IDs. The service records output first, builds a section-type-to-ID map from persisted sections, and records validation results with affected section IDs.

If validation includes `failed` or `blocked`, the service does not call `markReviewReady`; the repository moves the run to `validation_failed`.

### Decision: Verify with fake provider and rollback transaction

`execution-check.ts` will follow existing local verifier style: seed tenant/team/users/prompt/run fixtures inside a database transaction, execute success and failure flows, assert persisted detail state, assert cross-team isolation, assert no sensitive fragments in errors/results, and throw a rollback sentinel at the end.

This gives a repeatable proof without consuming DeepSeek quota or requiring credentials.

## Risks / Trade-offs

- State transition drift -> Mitigation: the execution service delegates transitions to repository methods and tests invalid states.
- Partial persistence after failure -> Mitigation: the verifier runs inside a transaction; the service records provider metadata before output and never persists output when generation throws.
- Validation result section mapping could be lossy if the provider returns duplicate section types -> Mitigation: affected section IDs map all persisted sections of the affected type; later section-level regeneration can add more precise IDs.
- Provider failures may occur before metadata is available -> Mitigation: record safe internal request ID, provider policy, error code, and recoverable flag; do not fabricate response IDs or raw details.
- Service could become a hidden production AI trigger -> Mitigation: no public API/UI/queue wiring and fake-provider verification only in this wave; live provider use remains an explicit later OpenSpec decision.
- User-provided API key appeared in chat -> Mitigation: no key is stored or echoed; configuration remains environment-variable-only and the user should rotate the exposed key.

## Migration Plan

1. Add the local execution verifier first and observe it fail because `execution.ts` and the script do not exist.
2. Implement the minimal execution service and helper mapping.
3. Add package scripts.
4. Update contract, roadmap, README, and this change's tasks.
5. Run focused checks, full type/lint/build, and OpenSpec validation.
6. Archive the change after verification passes.

Rollback path: remove `execution.ts`, `execution-check.ts`, scripts, and documentation/spec updates. No database migration or dependency rollback is needed.

## Open Questions

- Whether future public triggering should be a Route Handler, a thin Server Action wrapper, or a queue command remains out of scope until auth/session runtime and production AI release are proposed.
- Whether long runs require queue retries remains a Stage 9 decision.
- Prompt full-text storage remains unresolved; this wave continues to use prompt metadata and prompt fingerprint only.
