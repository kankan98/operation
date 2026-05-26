## 1. Server Evidence Summary

- [x] 1.1 Add V0 trial feedback evidence summary types and deterministic next-focus mapping in the server repository.
- [x] 1.2 Extend scoped feedback listing to include total/included counts, low-rating counts, signal distribution, hotspots, recent notes, and recommendation without changing the database schema.
- [x] 1.3 Preserve auth, tenant/team scope, no-store response, safe errors, and existing feedback list compatibility in the API route.

## 2. Trial Evidence UI

- [x] 2.1 Extend client feedback helper types to read the evidence summary from `GET /api/trial-feedback`.
- [x] 2.2 Add a compact feedback evidence review panel to the trial/overview cockpit after a verified session is ready.
- [x] 2.3 Ensure the panel covers loading, empty, error, success/update-after-submit, sparse-data, desktop, and mobile states with concise Chinese operator copy and no text overflow.

## 3. Verification Scripts

- [x] 3.1 Update the local `trial-feedback:check` coverage for evidence summary counts, hotspots, sparse-feedback recommendation, scoped isolation, no-store, and safe redaction boundaries.
- [x] 3.2 Run affected auth/trial checks to ensure the new summary response does not regress existing V0 trial access.

## 4. Documentation And OpenSpec

- [x] 4.1 Update roadmap/goal docs to record feedback evidence review as the current gate for accelerating V0 usable-version work.
- [x] 4.2 Run `openspec validate review-v0-trial-feedback-evidence` and update artifacts if validation exposes missing requirements.

## 5. Final Verification And Release Gate

- [x] 5.1 Run lint, typecheck, and build after implementation.
- [x] 5.2 Run Playwright before archive for desktop and mobile evidence rendering, update-after-submit, console health, and no incoherent overflow.
- [x] 5.3 Complete the pre-archive gate; after archive, follow project rule for conventional commit, push, Docker redeploy, and public smoke.
