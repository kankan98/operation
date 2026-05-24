## Context

The project has local-only repository slices for product data, session capture, knowledge lifecycle, talk-track assets, and next-session tasks. `ai-review-run` is the next missing ledger: the contract exists, but there is no runtime place to preserve input snapshots, reviewed knowledge snapshots, prompt version metadata, structured review output, validation results, human decisions, feedback, or downstream handoff references.

Pre-proposal research used official and standards sources:

- DeepSeek official API docs: user provided `https://api-docs.deepseek.com/zh-cn/`, base URL `https://api.deepseek.com`, and model name `deepseek-v4-pro`; this informs the future provider gate only.
- OpenAI official structured output guidance: structured model output must be schema-bound and validated before product use; this supports storing output schema versions and validation results.
- NIST AI RMF: AI output needs governance, traceability, and human oversight; this supports review decisions and audit metadata.
- OWASP LLM Top 10: prompt injection, sensitive information disclosure, overreliance, and unsafe output handling are relevant risks; this supports redaction blockers and downstream review gates.
- W3C PROV-O: generated artifacts should preserve source/provenance relationships; this supports linking runs, snapshots, sections, and downstream artifacts.
- Drizzle/PostgreSQL official docs: schema, migrations, constraints, indexes, and transactions are the accepted local persistence mechanism.

Skill-backed value exploration:

- Jobs-to-be-done: live operators and reviewers need to turn a session into reliable recap, talk-track candidates, video topics, and next-session actions without losing evidence.
- Recommendation canvas: the AI idea is worth investment only if suggestions remain reviewable, auditable, and reusable; automatic generation without provenance is deferred.
- Context engineering advisor: the run must store bounded snapshots instead of raw full transcripts or broad knowledge dumps.
- AI-shaped readiness advisor: this slice moves the product from one-off prompts toward orchestrated, traceable AI workflow infrastructure.
- Roadmap planning: this is the smallest stage-5 prerequisite after stage-4 local repositories; auth provider and real provider adapter remain separate gates.

## Goals / Non-Goals

**Goals:**

- Add local-only AI review persistence tables and a server-only repository that follows existing `DataAccessContext` and repository patterns.
- Persist bounded input snapshots, knowledge snapshots, prompt version metadata, provider invocation metadata, structured outputs, output sections, validation results, human decisions, feedback signals, and downstream artifact references.
- Enforce tenant/team isolation, `run_ai_review` permission, redaction blockers, stale/conflicting knowledge blockers, prompt version state, state transitions, validation blockers, and human review before downstream reuse.
- Add a rollback-style local verifier and `ai-review:check` scripts.
- Update durable docs and specs so future agents know what exists and what remains deliberately unimplemented.

**Non-Goals:**

- No DeepSeek/OpenAI provider call, provider SDK, prompt execution, streaming, queue, RAG, source discovery, public API, Server Action, frontend UI save flow, or production database provider.
- No storage of user-provided API keys, full prompt text, full provider request/response payloads, full transcripts, customer personal data, private messages, orders, phone numbers, addresses, or secrets.
- No automatic publishing of AI suggestions into knowledge, talk tracks, video topics, or next-session tasks without human review.

## Decisions

### Local persistence before provider execution

Implement the run ledger first, using PostgreSQL/Drizzle and local rollback verification. This preserves the current stage roadmap: provider calls require a later `AiProviderPort`/adapter change, but the run ledger can be verified without credentials or external network calls.

Alternatives considered:

- Direct DeepSeek adapter now: rejected for this wave because it combines credentials, provider failures, prompt execution, structured output parsing, and persistence in one change.
- Static docs only: rejected because downstream stage-5 work needs concrete schema/repository behavior.

### App-owned schema, not provider payload archive

Persist provider invocation metadata only: provider name, API family, model, request/response IDs, timing, token summary, finish reason, error code, and redaction status. Do not store full request or response payloads.

Rationale: provider metadata is useful for audit and retry; full prompt/payload storage creates avoidable leakage risk and conflicts with project security rules.

### Bounded snapshots as first-class records

Store `ai_review_input_snapshots` and `ai_review_knowledge_snapshots` as structured, redacted JSON summaries with explicit redaction, long-input, freshness, conflict, and review states. Repository methods reject snapshots that are blocked, stale-blocked, conflict-blocked, or insufficient.

Rationale: AI output quality depends on relevant context, but context stuffing raw transcripts and broad knowledge dumps is unsafe and expensive.

### State-machine methods instead of generic CRUD

Repository methods will represent workflow commands:

- `createPromptVersion`
- `prepareRun`
- `startRun`
- `recordProviderInvocation`
- `recordOutput`
- `recordValidationResult`
- `markReviewReady`
- `recordDecision`
- `recordFeedbackSignal`
- `createDownstreamArtifact`
- `archiveRun`
- `getRun`
- `listRuns`

Rationale: AI review runs have states and gates. Generic update methods would make invalid transitions and downstream leakage easier.

### Human review gates downstream artifacts

`createDownstreamArtifact` requires an accepted or edited section, and a run in `accepted`, `partially_accepted`, or `downstream_ready`. Rejected, pending, validation-failed, provider-failed, blocked, or archived runs cannot create downstream artifacts.

Rationale: AI suggestions are candidates, not facts or ready-to-use work products.

### DeepSeek provider as a recorded future gate

The user supplied DeepSeek provider intent, but the API key is a secret and this change must not persist it. Later provider work should create a dedicated OpenSpec change that reads official DeepSeek docs, defines an `AiProviderPort` adapter, stores credentials only in environment variables, and verifies timeout, refusal, rate limit, malformed JSON, empty content, and redaction behavior.

## Risks / Trade-offs

- Broad schema now could overfit before real provider output exists -> keep columns to contract-backed entities and use bounded JSON for provider-neutral snapshots/output items.
- Local repository checks can prove data rules but not model quality -> explicitly defer provider execution and evaluation to later OpenSpec changes.
- More tables increase migration and maintenance surface -> follow existing local repository patterns and add a rollback verifier that covers state transitions and blockers.
- Storing AI metadata can leak sensitive business details if too rich -> persist metadata summaries only and redact or reject sensitive snapshot states.
- User-provided key was shared in chat -> do not write it anywhere; recommend rotation/configuration via environment variables before any real provider integration.

## Migration Plan

1. Add Drizzle schema enums/tables for AI review persistence.
2. Generate migration with `pnpm db:generate` and apply locally with `pnpm db:migrate`.
3. Add repository and local rollback verifier.
4. Add root/web `ai-review:check` scripts.
5. Update contracts, roadmap, README, accepted specs, and OpenSpec tasks.
6. Rollback path: remove this change's tables/enums via migration rollback or revert the migration before production use. Since this is local-only and no public API writes to it, no user-facing data migration is required.

## Open Questions

- Whether the later DeepSeek adapter should use OpenAI-compatible client semantics or a minimal `fetch` adapter behind `AiProviderPort`.
- Whether prompt version bodies should be stored in database, versioned files, or a future prompt registry.
- Whether long AI review runs need a queue in MVP or can remain synchronous until real provider latency data exists.
