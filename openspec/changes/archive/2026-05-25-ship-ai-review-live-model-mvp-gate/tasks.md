## 1. Live Gate Runtime

- [x] 1.1 Add a server-only AI review live-model gate helper that reads `OPERATION_ENABLE_LIVE_AI_REVIEW`, validates DeepSeek config safely, and returns redacted readiness metadata.
- [x] 1.2 Add protected no-store live-model readiness route handling with auth cookie, explicit tenant/team scope, safe errors, and no provider call.
- [x] 1.3 Update live execute route behavior so disabled live mode fails before DeepSeek provider creation and configured live mode uses the existing execution service.

## 2. Browser Workflow

- [x] 2.1 Extend AI review client workflow types and payload helpers for fake/live mode, safe readiness, live provider policy, and new live-disabled errors.
- [x] 2.2 Update `/ai-review` workbench UI to load readiness, show compact fake/live mode state, keep fake mode default, and call live execute only when ready.
- [x] 2.3 Ensure loading, disabled, error, and success states remain operator-facing, accessible, and free of internal architecture or secret details.

## 3. Verification

- [x] 3.1 Add local live-gate verifier coverage for disabled gate, missing config, configured readiness, auth/scope failures, safe error bodies, and no sensitive leakage.
- [x] 3.2 Update existing AI review route/V0/provider verifiers where needed so fake-provider regressions and live-gate behavior are both covered without live calls by default.
- [x] 3.3 Add optional live smoke path that requires explicit live smoke environment flags and reports only safe provider metadata or safe error codes.

## 4. Documentation And Specs

- [x] 4.1 Update AI review contract, architecture roadmap, autonomous roadmap, goal document, and web README to distinguish V0 fake generation, gated live-model MVP, and future production AI release.
- [x] 4.2 Update accepted/delta specs where implementation evidence changes requirement wording or verification expectations.

## 5. Validation

- [x] 5.1 Run `openspec validate ship-ai-review-live-model-mvp-gate`.
- [x] 5.2 Run focused runtime verifiers for AI provider, AI review route, AI review V0, and the new live gate.
- [x] 5.3 Run `pnpm lint`, `pnpm typecheck`, and `pnpm build`.
- [x] 5.4 Before archive, run Playwright browser checks for `/ai-review` fake/live readiness states on desktop and mobile.
