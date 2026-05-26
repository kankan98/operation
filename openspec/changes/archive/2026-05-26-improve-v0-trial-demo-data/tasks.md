## 1. Demo Data Contract And Seed

- [x] 1.1 Add a server-only V0 trial demo data module with deterministic sample inputs, scoped existence checks, and safe de-identified copy.
- [x] 1.2 Wire the demo seed helper into the existing V0 bootstrap path without changing bootstrap disablement, CSRF, cookie, no-store, or safe response behavior.
- [x] 1.3 Ensure the seeded story creates or reuses one scoped record across session capture, racket product, knowledge, AI review, talk-track asset, and next-session task surfaces.

## 2. Trial Guidance UI

- [x] 2.1 Add compact demo scenario guidance to the trial/overview cockpit after verified session readiness.
- [x] 2.2 Keep data-safety reminders concise and operator-facing, with no OpenSpec/backend/provider/internal architecture narration in normal UI.
- [x] 2.3 Preserve loading, empty/error, feedback, desktop, and mobile states without text overflow or visual clutter.

## 3. Verification Coverage

- [x] 3.1 Add or extend a local demo-data check that verifies repeated bootstrap idempotency, non-zero readiness counts for all six workbenches, safe redaction, and feedback compatibility.
- [x] 3.2 Run affected local checks: demo-data check, `trial-mvp:check`, `internal-trial:check`, `trial-feedback:check`, and other workbench checks touched by the seed path.

## 4. Documentation And OpenSpec

- [x] 4.1 Update roadmap/goal docs with the V0 demo-data completion state, revised internal V0 estimate, and next candidate tasks.
- [x] 4.2 Run `openspec validate improve-v0-trial-demo-data` and fix any proposal/spec/task issues.

## 5. Final Verification And Release Gate

- [x] 5.1 Run lint, typecheck, and build after implementation.
- [x] 5.2 Run Playwright before archive for `/trial` and `/` desktop/mobile demo guidance, trial readiness, feedback compatibility, console health, and no incoherent overflow.
- [x] 5.3 Archive only after verification passes, then commit with Conventional Commit, push, redeploy Docker, and run public smoke.
