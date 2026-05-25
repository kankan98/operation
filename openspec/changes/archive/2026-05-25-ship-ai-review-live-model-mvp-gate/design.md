## Context

Current AI review has the hard parts already in place: `AiProviderPort`,
DeepSeek adapter, generation orchestrator, execution service, protected API
runtime, V0 fake-provider route, browser workflow, and local verifiers. The gap
is release control. The production execute route can create a DeepSeek provider
when credentials are present, but the browser intentionally calls `execute-v0`
and gives operators no safe way to see or use a gated real model.

This change is technology roadmap stage 5: AI review MVP. It must preserve the
existing UI/domain/data/AI boundaries:

- UI renders mode, readiness, errors, and review actions.
- Route handlers enforce auth, scope, CSRF, release gate, and no-store JSON.
- AI execution remains through `executeAiReviewRun` and injected
  `AiProviderPort`.
- DeepSeek secrets remain environment-only and never reach browser, logs,
  OpenSpec, screenshots, or final reports.

## Goals / Non-Goals

**Goals:**

- Add a server-only live model gate using `OPERATION_ENABLE_LIVE_AI_REVIEW=1`.
- Add safe readiness/status for live AI review: enabled, configured, provider,
  model, and operator-facing unavailable reason.
- Let `/ai-review` keep fake-provider generation as the default, while showing a
  live-model option only as a gated MVP path.
- Ensure live execution is blocked before provider creation when the release
  gate is disabled.
- Verify disabled, missing-config, safe-error, fake-provider regression, and
  optional live smoke behavior without consuming provider quota by default.
- Update contracts, roadmap, and README so V0 fake generation, live-model MVP,
  and future production AI release are distinct.

**Non-Goals:**

- No provider SDK dependency; use the existing `fetch`-based DeepSeek adapter.
- No RAG, Q&A, source discovery, queue, object storage, production auth provider,
  external commerce/Douyin integration, or analytics provider.
- No automatic publishing of AI output to authoritative knowledge, talk tracks,
  or completed tasks.
- No storing full prompts, provider payloads, raw transcripts, cookies, or API
  keys.
- No Docker redeploy until archive unless needed to repair preview.

## Decisions

### Decision 1: Add an explicit AI review live release gate

Use `OPERATION_ENABLE_LIVE_AI_REVIEW=1` as the required release switch for
browser/API live model execution. `DEEPSEEK_API_KEY` alone is not enough.

Alternatives considered:

- Use key presence as the release switch. Rejected because accidentally setting
  a key would expose quota, cost, and privacy risk.
- Add a database feature flag. Deferred because this project does not yet have a
  production tenant admin surface or feature flag provider.
- Reuse `OPERATION_ENABLE_V0_BOOTSTRAP`. Rejected because V0 preview access and
  live AI provider release are separate risk boundaries.

### Decision 2: Add a safe status route instead of exposing env to the client

Add a protected read route such as `/api/ai-review/live-model/status` that
requires auth cookie and explicit tenant/team scope. It returns only safe fields:
`enabled`, `configured`, `ready`, `provider`, `providerApi`, `model`,
`modeLabel`, and `userMessage`.

Alternatives considered:

- Use `NEXT_PUBLIC_*` env. Rejected because readiness depends on server-only
  secrets and must not expose credential state directly.
- Let the UI attempt live execution and infer status from failures. Rejected
  because it creates avoidable provider attempts, poor UX, and noisy errors.

### Decision 3: Keep fake generation as default and add an explicit live mode

The operator workbench will default to local V0 generation. When status reports
live ready, the UI can switch to real-model execution and call the existing
`/execute` route with a DeepSeek provider policy. When live is not ready, the UI
shows a disabled, operator-facing reason.

Alternatives considered:

- Replace fake generation with live generation. Rejected because local/dev
  verification would become flaky and costly.
- Create a separate `/ai-review-live` page. Rejected because it fragments the
  MVP workflow and duplicates UI state.

### Decision 4: Normalize live-disabled as a safe AI review route error

Add an app-owned route error code such as `AI_REVIEW_LIVE_MODEL_DISABLED`.
Disabled live execution should return before provider creation and should not
log or return env values. Missing or invalid DeepSeek config remains a provider
configuration error when the release gate is enabled.

Alternatives considered:

- Return generic `AI_PROVIDER_CONFIG_MISSING` for disabled gate. Rejected
  because it hides the real operator/admin action and makes verification less
  precise.

### Decision 5: Optional live smoke is explicitly opt-in

Normal checks continue to use fake providers. Optional live smoke requires both
provider credentials and an explicit smoke flag, for example
`AI_REVIEW_LIVE_SMOKE=1`, and reports only safe metadata or safe error codes.

Alternatives considered:

- Always live-test when a key is present. Rejected because it can burn quota and
  leak accidental environment state into verification behavior.

## Risks / Trade-offs

- Live model returns malformed or weak JSON -> Keep Zod schema validation,
  validation results, and review-ready gate; show recoverable operator copy.
- Provider timeout/rate limit/auth failure -> Existing provider error mapping is
  preserved; UI exposes retry/recovery without raw payload.
- Operators over-trust AI output -> UI labels output as reviewable suggestions,
  requires human section decisions, and only creates draft downstream references.
- Sensitive data reaches provider -> Existing bounded input snapshot and
  redaction gates remain required; checks verify no prompt/key/raw transcript
  leakage.
- Status route reveals too much operational state -> Return only safe readiness
  booleans and model identifier, never env names, keys, DB URLs, prompts, or
  provider payloads.
- Added UI mode creates clutter -> Use compact badges and a small mode control
  inside the existing AI review panel; no marketing copy or decorative redesign.

## Migration Plan

1. Add the live gate helper and status/execute route behavior with disabled
   defaults.
2. Extend client types and UI to load live readiness and select fake/live
   execution mode.
3. Add/update local verifiers for disabled, configured, missing config, and
   redaction checks.
4. Update docs, contract, roadmap, and spec deltas.
5. Run OpenSpec validation and local checks. Playwright runs before archive.
6. On archive, commit with Conventional Commit, push, build Docker, redeploy,
   and verify the public preview.

Rollback is configuration-first: remove or unset
`OPERATION_ENABLE_LIVE_AI_REVIEW` and the UI continues using fake V0 generation.
Code rollback also preserves existing `execute-v0` behavior.

## Open Questions

- Whether the first public preview should enable live AI depends on secret
  provisioning, provider quota, and whether the public HTTP preview is still
  restricted to non-sensitive demo data. This change supports live mode but does
  not require enabling it during Docker preview deployment.
