## Why

The current AI review workflow can prepare runs, execute deterministic V0 fake
generation, record human decisions, and create downstream references, but the
browser-facing MVP still cannot safely prove the value of a real DeepSeek model
in the operator loop. Public trial access now exists, so the next coherent MVP
wave is to release real-model AI review behind explicit gates while preserving
the fake-provider path as the default fallback.

This solves the operator-visible gap between "the workflow works" and "the AI
review is useful enough to try": live-commerce operators need to see whether a
real model can turn submitted session notes into reviewable talk-track, short
video, and next-session suggestions without leaking sensitive data or treating
AI output as fact.

## Source Research

- DeepSeek official API docs were checked for chat completions, JSON output, and
  provider error handling. They are the primary vendor source for the configured
  base URL/model behavior, JSON mode, request shape, and live smoke constraints:
  https://api-docs.deepseek.com/zh-cn/
- OWASP Top 10 for LLM Applications was checked for prompt injection, sensitive
  information disclosure, insecure output handling, and excessive agency risks.
  It is a security-focused industry source, so this change keeps AI output
  review-only, redacted, and bounded before downstream use:
  https://owasp.org/www-project-top-10-for-large-language-model-applications/
- NIST AI Risk Management Framework was checked for governance, measurement,
  management, traceability, and human oversight framing. It supports keeping
  prompt/model metadata, validation results, and human decisions auditable before
  treating output as useful workflow material:
  https://www.nist.gov/itl/ai-risk-management-framework
- UI/UX skill research was run for a Chinese AI operations dashboard. The
  product-specific decision is to ignore marketing-heavy style suggestions and
  keep the existing dense operational UI, while adding explicit enabled,
  disabled, loading, error, and review states with accessible error feedback.

## Skill-Backed Value Exploration

- OpenSpec exploration: The smallest coherent wave is not another single API
  endpoint. It is a release gate that connects existing provider, execution,
  route, UI, verifier, contract, and roadmap surfaces into one MVP-ready AI
  review workflow.
- Recommendation canvas / AI-shaped readiness: This is worth doing now because
  it compresses the operator learning loop. A real model can reveal whether
  submitted session notes produce actionable talk-track and task suggestions;
  fake output cannot validate that product value.
- Context engineering: The live call must use bounded, redacted input snapshots
  and reviewed knowledge snapshots. It must not send raw transcripts, cookies,
  credentials, full prompts, or unrelated workspace context to the provider.
- UI/UX exploration: The restrained product highlight is a clear "真实模型"
  execution state with safe recovery, not decorative UI. Operators should know
  whether they are generating a local simulation or a real AI review and what to
  do if the provider is unavailable.

## What Changes

- Add an explicit server-side live AI review release gate. Missing gate,
  missing key, invalid config, or disabled live mode returns safe responses and
  never calls DeepSeek.
- Add safe provider status/readiness behavior for the AI review workbench so the
  browser can show whether real-model generation is available without exposing
  secrets or provider payloads.
- Extend the `/ai-review` MVP workflow so operators can keep using the default
  local V0 fake generation, and can use live DeepSeek generation only when the
  server says the live gate is enabled.
- Preserve existing fake-provider verifiers and add coverage for live gate
  disabled/missing-config behavior, safe error copy, and no secret/prompt/raw
  payload leakage.
- Add optional live smoke verification guarded by explicit environment flags;
  normal local and CI checks must not consume provider quota.
- Update the AI review contract, roadmap, README, and accepted spec deltas so
  fake-provider V0, gated live-model MVP, and future production AI release are
  separated clearly.
- No new AI provider SDK, RAG, queue, production login provider, external
  platform integration, automatic publishing, or authoritative knowledge update
  is introduced in this wave.

## Capabilities

### New Capabilities

- `ai-review-live-model-gate`: Server-side release gate, safe readiness status,
  browser execution affordance, failure handling, and verification for live
  DeepSeek-backed AI review in the MVP workflow.

### Modified Capabilities

- `ai-provider-port`: Clarify that live provider execution requires both valid
  provider configuration and an explicit AI review live release gate; default
  local checks remain fake-provider only.
- `ai-review-api-runtime`: Add safe live readiness/status behavior and require
  live execute routes to honor the release gate before creating providers.
- `operator-v0-ai-review-workflow`: Add browser-facing live/fake execution mode
  distinction while preserving fake execution as the default path.

## Impact

- Affected frontend: `apps/web/src/components/ai-review-workbench.tsx` and
  `apps/web/src/lib/ai-review-v0-workflow.ts`.
- Affected API/runtime: AI review route handlers under
  `apps/web/src/app/api/ai-review/**`, `apps/web/src/server/ai-review/*`, and
  DeepSeek provider env handling under `apps/web/src/server/ai-provider/*`.
- Affected verification: AI provider, AI review route, AI review V0, and new
  live-gate checks; Playwright is required before archive because rendered UI
  behavior changes.
- Affected docs/specs: `docs/contracts/ai-review-run.md`,
  `docs/roadmap/ai-continuous-development-goal.md`,
  `docs/roadmap/autonomous-development-roadmap.md`,
  `docs/architecture/technical-implementation-roadmap.md`,
  `apps/web/README.md`, and relevant OpenSpec specs.
- Secret handling: `DEEPSEEK_API_KEY` remains environment-only. The provided key
  is not written to code, docs, specs, logs, screenshots, or final reports.
