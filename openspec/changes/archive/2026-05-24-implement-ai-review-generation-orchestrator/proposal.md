## Why

AI review currently has a local run ledger and a DeepSeek `AiProviderPort`, but
there is still no server-only service that turns a redacted session snapshot and
reviewed knowledge snapshot into validated review suggestions. This blocks the
operator workflow that should reduce post-live recap, objection analysis,
talk-track drafting, and next-session planning effort.

This is the right next step after the provider gate because it creates a small,
auditable AI review MVP slice without exposing public APIs, adding UI save
flows, introducing RAG, or treating model output as authoritative business fact.

## Proposal Gate Evidence

- Reliable source research:
  - DeepSeek official API docs were checked on 2026-05-24:
    `https://api-docs.deepseek.com/`, `https://api-docs.deepseek.com/zh-cn/guides/json_mode`,
    and `https://api-docs.deepseek.com/zh-cn/quick_start/error_codes`.
    They confirm `https://api.deepseek.com`, `deepseek-v4-pro`, chat completions,
    JSON Output via `response_format: {"type":"json_object"}`, the need to
    mention JSON and provide an output example in the prompt, and failure modes
    including 401, 402, 429, 500, and 503.
  - DeepSeek model/pricing and change-log docs were checked to confirm
    V4-Pro availability and that legacy model names are being deprecated:
    `https://api-docs.deepseek.com/quick_start/pricing` and
    `https://api-docs.deepseek.com/updates`.
  - NIST AI RMF was checked as a standards-body source:
    `https://www.nist.gov/itl/ai-risk-management-framework`. It supports a
    risk-managed workflow with governance, measurement, management, and
    evaluation rather than one-off generation.
  - OWASP Top 10 for LLM Applications was checked as an application security
    source:
    `https://owasp.org/www-project-top-10-for-large-language-model-applications/`.
    It reinforces prompt-injection, sensitive information disclosure, insecure
    output handling, and overreliance controls.
- Skill-backed value exploration:
  - `openspec-explore`: current state has no active change; the next coherent
    roadmap gap is AI review generation after the DeepSeek provider gate.
  - `recommendation-canvas`: the AI investment is justified only if it produces
    reviewable operational artifacts, not generic summaries.
  - `jobs-to-be-done`: the primary job is helping live operators and reviewers
    transform session notes into recap, question clusters, objection handling,
    talk-track candidates, short-video topics, and next-session tasks.
  - `ai-shaped-readiness-advisor`: this should be an orchestrated, traceable
    AI workflow, not a one-off prompt helper.
  - `context-engineering-advisor`: the prompt must use bounded snapshots and
    minimal reviewed context instead of dumping full transcripts or broad
    knowledge into the model.
  - `codebase-recon`: repository history is tiny and current risk is less about
    legacy hotspots than preserving the recently added AI/data boundaries.

## What Changes

- Add a server-only AI review generation orchestrator that:
  - Accepts bounded, redacted session input snapshots and reviewed knowledge
    snapshots in the existing AI review domain language.
  - Builds a versioned prompt request for `AiProviderPort` without logging or
    returning full prompts, provider payloads, raw transcripts, customer PII, or
    secrets.
  - Requests structured JSON output and validates it with a local Zod schema
    before any caller can use it.
  - Produces AI review sections for live recap, product diagnosis, question
    clusters, objection patterns, talk-track candidates, short-video topics,
    and next-session actions.
  - Runs lightweight local validation for schema, empty sections, source
    grounding, sensitive-data markers, stale/conflicting knowledge, and low
    evidence.
  - Maps provider errors into AI review generation failure categories with
    retryability hints.
- Add a local verifier script using a fake provider. The default check must not
  call DeepSeek or require a real API key.
- Update the AI review contract, architecture notes, roadmap, README, accepted
  specs, and package scripts so future work starts from the new boundary.
- Do not add npm dependencies, public APIs, Server Actions, UI wiring, RAG,
  queueing, object storage, or a live DeepSeek smoke path in this change.
- Do not write, echo, store, or reuse the API key shared in chat. Credentials
  remain environment-only and are outside this OpenSpec change.

## Capabilities

### New Capabilities
- `ai-review-generation-orchestrator`: server-only prompt orchestration,
  structured output schema validation, provider error mapping, local validation,
  and fake-provider verification for AI review generation.

### Modified Capabilities
- `ai-review-run-contract`: records that a local server-only generation
  orchestrator exists while public APIs, Server Actions, RAG, UI save flows,
  queueing, and production AI release remain deferred.
- `ai-review-run-persistence`: clarifies how generated outputs and validation
  results can be handed to the existing local run ledger after successful
  orchestration without weakening human review gates.
- `ai-provider-port`: clarifies that the provider port is consumed by the AI
  review generation orchestrator and remains server-only and provider-neutral.

## Impact

- Code:
  - New server-only AI review generation module and verifier under
    `apps/web/src/server/ai-review/`.
  - Existing package scripts gain an `ai-review:generation-check` command.
- Data:
  - No new database tables or migrations.
  - No production provider call by default.
  - No persisted full prompt, full provider payload, raw transcript, customer
    PII, order data, or secret.
- Architecture:
  - Belongs to technical roadmap stage 5, AI review MVP.
  - Preserves UI -> domain/service -> `AiProviderPort` boundaries.
  - Keeps RAG, retrieval, queueing, public route handlers, and browser save
    flows out of scope.
- Verification:
  - TDD red/green verifier for success, blocked snapshots, missing knowledge,
    long/empty input, provider timeout/rate limit/refusal/partial output,
    malformed/schema-mismatched output, sensitive markers, source-grounding
    warnings, and no secret/prompt leakage in safe errors.
  - `openspec validate implement-ai-review-generation-orchestrator`.
  - `pnpm ai-review:generation-check`, `pnpm ai-provider:check`,
    `pnpm typecheck`, `pnpm lint`, `pnpm build`, and `openspec validate --all`.
