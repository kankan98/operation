## Why

`/sessions -> /ai-review` now proves the first visible V0 value loop, but accepted AI review sections still stop at review. Operators need to turn a useful suggestion into reusable talk tracks and next-session tasks without copying text between static pages.

This wave closes the next V0 operations loop: review a session, accept useful AI sections, create downstream draft artifacts, and then inspect or progress them in `/talk-tracks` and `/next-actions`.

Source and skill notes:

- Douyin E-commerce Compass official product positioning supports prioritizing after-live diagnosis, product/persona insights, and follow-up optimization over another isolated static page.
- NIST AI RMF supports keeping AI output governed, human-reviewed, and traceable before it affects operational artifacts.
- OWASP Top 10 for LLM Applications supports preserving output validation, sensitive-data redaction, and avoiding over-automated downstream actions.
- Next.js official Server Actions guidance was considered, but this wave will reuse existing protected Route Handlers because those APIs already encode auth, scope, CSRF, repository gates, and rollback checks; Server Action wrappers remain a later thin UI layer.
- `opportunity-solution-tree` conclusion: the strongest opportunity is reducing the manual gap between "AI suggestion accepted" and "team can reuse/follow up"; the best POC is a browser downstream artifact workbench rather than production provider/RAG expansion.
- `ui-ux-pro-max` guidance was adapted: keep the calm, dense operational dashboard style; adopt clear focus/loading/empty/error states and mobile checks, but reject webinar/marketing layout recommendations.

## What Changes

- Add an operator V0 downstream artifact workflow that resolves the same local V0 team context as `/sessions` and `/ai-review`.
- Extend the local V0 bootstrap permission override so the internal operator can create talk-track assets and next-session tasks without changing global role policy.
- Add a shared browser helper for downstream scope, API errors, CSRF headers, accepted AI section filtering, and safe payload mapping.
- Upgrade `/talk-tracks` from placeholder to a browser workflow that lists scoped talk-track assets and creates draft assets from accepted AI review sections or manual operator input.
- Upgrade `/next-actions` from placeholder to a browser workflow that lists scoped next-session tasks, creates source-linked tasks from accepted AI review sections or manual operator input, and supports basic status/checklist progress.
- Add `/ai-review` affordances for accepted `talk_track_candidate`, `short_video_topic`, and `next_session_action` sections to create downstream draft references while keeping AI output reviewable and non-authoritative.
- Keep production auth, RAG, live DeepSeek calls, queueing, external platform integration, notifications, calendar/export, public source discovery, and automatic publication out of scope.
- Update README, roadmap, and accepted specs so future work starts from a V0 downstream browser workflow rather than static placeholder pages.

## Capabilities

### New Capabilities

- `operator-v0-downstream-artifact-workflow`: Browser-usable V0 workflow that connects accepted AI review sections to talk-track assets and next-session tasks through protected local APIs.
- `talk-track-workbench`: Browser workbench behavior for listing, creating, reviewing state, and showing reuse-ready talk-track assets in the local V0 team context.
- `next-actions-workbench`: Browser workbench behavior for listing, creating, and progressing next-session tasks in the local V0 team context.

### Modified Capabilities

- `operator-v0-session-workflow`: Local V0 bootstrap membership gains downstream permissions needed for the internal end-to-end V0 loop.
- `operator-v0-ai-review-workflow`: Accepted sections become eligible for downstream draft artifact creation while preserving human review gates.
- `ai-review-workbench`: `/ai-review` shows safe downstream creation affordances for accepted sections and records downstream draft references.
- `talk-track-asset-api-runtime`: Browser workflow requirements are added on top of the existing protected Route Handler runtime.
- `next-session-task-api-runtime`: Browser workflow requirements are added on top of the existing protected Route Handler runtime.

## Impact

- Affected UI: `/ai-review`, `/talk-tracks`, `/next-actions`, shared client helpers.
- Affected auth/runtime: local-only operator V0 permission override and verifier.
- Affected APIs: existing talk-track, next-action, and AI review downstream-artifact Route Handlers are reused; no new external provider, SDK, queue, or database table is expected.
- Affected checks: OpenSpec validation, local V0 auth check, talk-track and next-action route checks, new downstream V0 workflow check, lint, typecheck, build, and Playwright desktop/mobile verification before archive.
- Deployment: after archive, commit with Conventional Commit, push, rebuild Docker, restart `operation-web-preview`, and check public preview routes.
