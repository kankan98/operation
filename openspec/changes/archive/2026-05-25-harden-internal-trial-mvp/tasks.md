## 1. Trial MVP Audit

- [x] 1.1 Audit `/trial`, `/`, `/sessions`, `/rackets`, `/knowledge`, `/ai-review`, `/talk-tracks`, and `/next-actions` for continue behavior, loading/empty/error/retry states, unsafe copy, mobile overflow risk, and route-gate consistency.
- [x] 1.2 Record audit findings in the design or tasks if the implementation scope needs adjustment, including any route or helper that should remain unchanged.

## 2. Trial Continuity And Recovery

- [x] 2.1 Fix verified `/trial` continue behavior so safe known `next` paths reliably navigate to the requested workbench and unsafe/stale paths fall back cleanly.
- [x] 2.2 Improve shared trial status/cockpit behavior so verified team state, route availability, next-step actions, refresh, logout, and re-enter flows are clear without implementation details.
- [x] 2.3 Normalize safe recovery states for the workbenches touched by the audit, prioritizing frozen/blank/error-prone states over cosmetic changes.

## 3. MVP-Ready Workbench Polish

- [x] 3.1 Tighten operator-facing copy for trial status, unavailable provider-gated modes, disabled actions, empty states, and recovery actions across affected surfaces.
- [x] 3.2 Ensure touched controls and status panels remain accessible, keyboard focusable, and stable on desktop and mobile.
- [x] 3.3 Avoid introducing new dependencies, production auth assumptions, RAG/Q&A behavior, or external integration behavior while hardening the trial MVP.

## 4. Verification And Documentation

- [x] 4.1 Add or extend a focused `trial-mvp` verifier covering route-gate behavior, safe next fallback, bootstrap/session/logout boundaries, protected workbench route access under valid scope, and redaction.
- [x] 4.2 Update README, app README, roadmap, goal, and specs/docs where needed to distinguish internal trial MVP, public preview, and future production release.
- [x] 4.3 Run `openspec validate harden-internal-trial-mvp` and `openspec validate --all`.
- [x] 4.4 Run focused verifiers for trial MVP and any affected domain workflows.
- [x] 4.5 Run `pnpm lint`, `pnpm typecheck`, and `pnpm build`.
- [x] 4.6 Before archive, run Playwright checks for trial entry, verified continue into a requested workbench, representative desktop/mobile states, console health, and overflow.

## 5. Archive And Preview

- [x] 5.1 Archive the OpenSpec change after implementation and verification are complete.
- [x] 5.2 Commit with a Conventional Commit message, push to the git remote, rebuild Docker, redeploy `operation-web-preview`, and verify the public preview URL.
- [x] 5.3 Run post-deploy public preview smoke with HTTP checks and Playwright, confirming container health and `--restart unless-stopped`.
