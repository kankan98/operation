## Why

The project now has a browser-usable `/sessions` V0 capture workflow and a protected AI review API runtime, but `/ai-review` is still a static preview. Operators cannot yet continue from a submitted live session into a usable AI recap, which blocks the shortest V0 value loop: record a session, generate review suggestions, then decide what to reuse.

This change turns AI review into the next operator-facing V0 workflow while keeping the current safety boundaries: local/internal bootstrap only, explicit tenant/team scope, no production login provider, no RAG, no queue, no direct authoritative knowledge writes, and no default live provider call from browser verification.

## What Changes

- Add an AI review V0 browser workflow on `/ai-review` that resolves the same local V0 team context as `/sessions`.
- Let the operator load review-ready session captures, select one, prepare an AI review run, execute it through the existing protected AI review API, inspect validation/output sections, and record simple human review decisions.
- Extend the local V0 bootstrap membership so the internal V0 operator can run AI review in local/internal workflow verification without changing production authentication.
- Introduce a local fake-provider execution path for the V0 browser workflow so the first usable version can be verified without calling DeepSeek by default.
- Keep all AI output visibly reviewable suggestions, not authoritative facts or automatically published talk tracks/tasks.
- Keep downstream artifact creation as draft references or visible next-step affordances only; this wave does not create full talk-track or next-task browser workflows.
- Update docs and roadmap status so future work starts from the new browser AI review state rather than the previous static preview.

## Capabilities

### New Capabilities

- `operator-v0-ai-review-workflow`: Browser-usable V0 workflow that connects review-ready session captures to AI review run preparation, fake-provider execution, output inspection, human review decisions, and safe failure states.

### Modified Capabilities

- `operator-v0-session-workflow`: The local V0 bootstrap now needs AI review permission in addition to session capture so the internal browser workflow can move from submitted sessions into AI review.
- `ai-review-workbench`: `/ai-review` changes from frontend-only preview to an authenticated local V0 browser workflow that uses existing protected API routes while preserving reviewable-suggestion and safety boundaries.

## Impact

- Affected UI: `apps/web/src/components/ai-review-workbench.tsx`, `apps/web/src/lib/ai-review-workbench.ts`, and related page wiring.
- Affected auth/runtime: local-only operator V0 bootstrap permission seed and verifier.
- Affected AI review runtime: optional local V0 fake-provider route boundary or safe execution wrapper using the existing `AiProviderPort`; no new external provider SDK.
- Affected checks: OpenSpec validation, local operator V0 checks, AI review route/workflow checks, lint, typecheck, build, and Playwright browser verification before archive.
- Dependencies: no new npm dependency expected.
- External source notes for requirements:
  - Douyin E-commerce Compass official product page (`https://compass.jinritemai.com/welcome/product`) supports the product assumption that live-commerce teams need after-live diagnosis and operations review, so the next V0 loop should prioritize review over another static page.
  - NIST AI Risk Management Framework (`https://www.nist.gov/itl/ai-risk-management-framework`) supports keeping AI outputs traceable, reviewable, and governed rather than automatically authoritative.
  - OWASP Top 10 for LLM Applications (`https://owasp.org/www-project-top-10-for-large-language-model-applications/`) supports the sensitive-data, prompt/payload redaction, and bounded execution requirements.
  - DeepSeek official API docs (`https://api-docs.deepseek.com/zh-cn/`) remain the provider reference, but this change verifies with fake-provider by default and does not commit provider credentials or force live calls.
