## Why

The AI review run ledger now exists, but the project still lacks a safe,
provider-neutral way to call the user-selected DeepSeek model. This change
implements the provider gate required by the AI review contract so future AI
review and Q&A work can use a tested adapter without leaking secrets, binding UI
code to a vendor API, or treating malformed model output as usable content.

Pre-proposal source notes:

- DeepSeek official API docs confirm an OpenAI-compatible `POST
  /chat/completions` endpoint, base URL `https://api.deepseek.com`, model
  `deepseek-v4-pro`, and `response_format: { "type": "json_object" }`.
- DeepSeek official JSON output guidance requires the prompt itself to instruct
  the model to produce JSON and warns that `finish_reason="length"` can cut off
  JSON output, so local parsing and schema validation remain mandatory.
- DeepSeek official error codes identify 400, 401, 402, 422, 429, 500, and 503
  failure classes, so the adapter needs normalized safe errors and retryability
  hints instead of leaking raw provider payloads.
- NIST AI RMF frames AI risk management around trustworthy, accountable, secure,
  privacy-aware systems; this supports traceable run metadata and human review
  rather than silent model authority.
- OWASP Top 10 for LLM Applications highlights prompt injection, sensitive
  information disclosure, excessive agency, and overreliance; this keeps the
  first provider slice bounded to JSON generation and validation with no tools,
  no autonomous actions, and no raw prompt logging.

Skill-backed value exploration:

- OpenSpec exploration and roadmap planning: this is the smallest coherent
  stage-5 enabler after local AI review persistence; full prompt execution, RAG,
  queues, and browser save flows remain later changes.
- Jobs-to-be-Done: live operators and reviewers need faster review drafts, but
  the immediate job is engineering trust: make future generation safe enough to
  use with redacted session snapshots.
- Recommendation canvas: the investment is justified because it reduces vendor
  lock-in, secret leakage risk, and schema-mismatch rework before user-facing AI
  review is connected.
- Context-engineering advisor: the adapter must accept bounded messages and
  validated structured output, not bulk transcripts or unscoped context.
- AI-shaped readiness advisor: this builds traceable AI orchestration capability
  rather than one-off prompt calls.

## What Changes

- Add a server-only `AiProviderPort` boundary for JSON model generation,
  normalized provider metadata, safe errors, timeout handling, and schema
  validation.
- Add a DeepSeek chat-completions adapter using native `fetch`, defaulting to
  base URL `https://api.deepseek.com` and model `deepseek-v4-pro`.
- Add environment parsing for `DEEPSEEK_API_KEY`, optional base URL/model
  overrides, timeout, and max tokens. Secrets are read only from environment
  variables and are never committed, logged, or returned.
- Add a rollback-style local verifier with fake fetch coverage for success,
  missing config, timeout, rate limit, auth failure, provider unavailable,
  empty output, malformed JSON, partial output, and schema mismatch.
- Add an optional live smoke path that runs only when a runtime environment
  explicitly provides `DEEPSEEK_API_KEY`; normal verification must not require
  a real key or spend provider quota.
- Update contracts, roadmap, README, and accepted specs to record that the
  provider port and DeepSeek adapter exist while prompt orchestration, RAG,
  queues, public APIs, Server Actions, UI save flows, and production AI release
  remain out of scope.

## Capabilities

### New Capabilities

- `ai-provider-port`: Provider-neutral server-side AI generation boundary,
  DeepSeek adapter, environment secret handling, structured output validation,
  safe errors, timeout/failure mapping, and local verification.

### Modified Capabilities

- `ai-review-run-contract`: Record that the provider gate has a local runtime
  port/adapter implementation, while full AI review prompt execution and public
  workflow integration remain deferred.
- `agent-architecture-foundation`: Align the first LLM provider direction with
  the user's DeepSeek selection behind `AiProviderPort`, while preserving
  replacement boundaries and OpenAI as a reference direction.

## Impact

- Affected code: `apps/web/src/server/ai-provider/*`, root and web package
  scripts, `.env.example`.
- Affected docs/specs: AI review contract, agent architecture, technical
  roadmap, autonomous roadmap, README files, and OpenSpec accepted specs.
- Dependencies: no new npm dependency; use native Fetch API and existing Zod.
- Systems: no database migration, no UI change, no Docker deployment, no
  Playwright-required surface, no production secret storage.
