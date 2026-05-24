## Why

AI review generation can already produce structured suggestions through an injected `AiProviderPort`, and the AI review run repository can already persist run ledgers, provider metadata, outputs, validation results, human decisions, feedback, and downstream references. The missing operator-useful step is a server-only execution service that connects those two pieces so a prepared run can move from `queued` input to a persisted `review_ready` or safe failure state without leaking prompts, secrets, raw transcripts, or provider payloads.

This is the next smallest coherent wave because it improves the AI review MVP path for live-commerce operators while staying inside the accepted Stage 5 local-only AI boundary. It does not add public API, Server Actions, UI save flows, RAG, queueing, production auth, or live provider release.

## What Changes

- Add a server-only AI review execution service that loads a tenant/team-scoped run, builds generation input from existing persisted snapshots and prompt metadata, calls `generateAiReview`, records provider invocation metadata, stores structured output sections, records validation results, and marks the run `review_ready` only when no blocking validation exists.
- Add safe failure handling so input/evidence/provider/schema/policy errors update the repository ledger through provider or validation failure records without persisting partial AI output as usable suggestions.
- Add a local rollback verifier, `pnpm ai-review:execution-check`, that uses a fake provider by default and verifies success, validation-blocked output, provider failure, cross-team isolation, no prompt/secret leakage, and no live DeepSeek call.
- Update the AI review contract, architecture roadmap, autonomous roadmap, README references, and OpenSpec records so future agents know the execution service exists locally while public API/UI/RAG/queue/production release remain out of scope.
- No breaking changes.

## Capabilities

### New Capabilities
- `ai-review-execution-service`: Server-only local execution service that orchestrates an existing AI review run through generation, persistence handoff, validation recording, safe failure states, and rollback verification.

### Modified Capabilities
- None.

## Impact

- Affected code:
  - `apps/web/src/server/ai-review/execution.ts`
  - `apps/web/src/server/ai-review/execution-check.ts`
  - `apps/web/package.json`
  - root `package.json`
- Affected docs/specs:
  - `docs/contracts/ai-review-run.md`
  - `docs/architecture/technical-implementation-roadmap.md`
  - `docs/roadmap/ai-continuous-development-goal.md`
  - `docs/roadmap/autonomous-development-roadmap.md`
  - `README.md`
  - `apps/web/README.md`
  - OpenSpec delta spec for `ai-review-execution-service`
- Dependencies:
  - No new npm dependency.
  - No new database table or migration.
  - No live DeepSeek call by default; the service accepts an injected provider and the verifier uses a fake provider.

## Proposal Gate Evidence

- Reliable sources checked:
  - DeepSeek official API docs confirm the project must keep JSON output requests explicit, parse and validate model JSON, and handle provider error/failure states instead of trusting provider output as-is.
  - NIST AI RMF supports retaining traceability, human oversight, and risk controls for AI-assisted decisions.
  - OWASP Top 10 for LLM Applications supports the scope choice to block sensitive data, avoid prompt/payload leakage, and prevent excessive agency.
  - Docker official restart policy docs were checked for the public preview self-recovery question; the current container uses `--restart unless-stopped` and Docker daemon is enabled.
- Skill-backed value exploration:
  - OpenSpec exploration confirmed the next useful gap is not another provider adapter or another generation verifier, but the handoff between generation and the persisted review ledger.
  - JTBD framing: live operators need a reviewable recap that becomes reusable talk tracks, short-video topics, and next-session tasks without manually copying model output between tools.
  - Recommendation canvas: this AI slice is valuable with caveats because it compresses the post-live review cycle, but only if all output remains auditable and human-reviewed.
  - Context engineering check: the service must use bounded snapshots and prompt metadata, not full transcripts or broad knowledge dumps.
  - AI-shaped readiness check: the value is orchestration and traceability, not merely a one-off model call.
