## 1. Readiness Model

- [x] 1.1 Add a typed trial workflow readiness helper for six implemented V0 workbenches, collection count extraction, safe summaries, and next-step selection.
- [x] 1.2 Extend `trial-mvp:check` to verify empty, partial, complete, and malformed readiness summary behavior without leaking sensitive metadata.

## 2. Trial Cockpit UI

- [x] 2.1 Load workflow readiness after a verified trial session using existing scoped protected list APIs.
- [x] 2.2 Update the overview cockpit to show loading, ready, empty, partial, complete, and retry states with operator-facing copy.
- [x] 2.3 Keep direct links, refresh, logout, and continue actions stable on desktop and mobile.

## 3. Documentation

- [x] 3.1 Update the AI continuous development goal with the internal usable V0 progress boundary, approximate completion status, and accelerated delivery policy.
- [x] 3.2 Update the autonomous roadmap with the next V0 closeout status and post-V0 iteration sequence.

## 4. Verification And Archive

- [x] 4.1 Run `openspec validate harden-v0-usable-trial-workflow`.
- [x] 4.2 Run focused route/model checks including `pnpm trial-mvp:check`.
- [x] 4.3 Run `pnpm lint`, `pnpm typecheck`, and `pnpm build`.
- [x] 4.4 Run Playwright desktop and mobile verification for `/trial`, `/`, and next-step navigation before archive.
- [x] 4.5 Archive the OpenSpec change, commit with Conventional Commit format, push, redeploy Docker preview, and run public smoke verification.
