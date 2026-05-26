## 1. Data Model And Migration

- [x] 1.1 Add V0 trial feedback enums/table to the Drizzle schema with tenant/team/actor scope, ratings, issue type, note, real-work signal, safe metadata, indexes, and timestamps.
- [x] 1.2 Generate and review the Drizzle migration for the new feedback schema.

## 2. Server Repository And API

- [x] 2.1 Add a server-only V0 trial feedback repository with Zod validation, scoped create/list, note length validation, sensitive marker blocking, and safe domain errors.
- [x] 2.2 Add protected Route Handler helpers for `GET` and `POST /api/trial-feedback` with session cookie auth, explicit tenant/team scope, no-store JSON, mutation CSRF, and safe error mapping.
- [x] 2.3 Add the Next.js API route wrapper that opens database connections only after cookie/CSRF preflight checks pass.

## 3. Verification Scripts

- [x] 3.1 Add a rollback-style local feedback repository/API check covering valid create/list, invalid input, long notes, sensitive marker rejection, missing auth/scope/CSRF, cross-team isolation, no-store, and redaction.
- [x] 3.2 Add root and web package scripts for the feedback check and make the existing trial MVP check cover the new feedback API enough to catch route regressions.

## 4. Trial Feedback UI

- [x] 4.1 Add shared client-side feedback helpers/types for scoped feedback API calls and safe messages.
- [x] 4.2 Add a compact V0 trial feedback panel to the trial entry/overview cockpit with role, workbench, ratings, issue type, real-work signal, note, loading, disabled, success, error, and recent-feedback states.
- [x] 4.3 Ensure the feedback UI uses existing workspace styles, accessible labels/focus states, concise Chinese operator copy, and responsive desktop/mobile layout without marketing-style redesign.

## 5. Documentation And OpenSpec

- [x] 5.1 Update roadmap/goal docs to record V0 trial feedback as the evidence source for subsequent prioritization.
- [x] 5.2 Run `openspec validate capture-v0-trial-feedback` and update OpenSpec artifacts if implementation evidence changes scope or verification.

## 6. Final Verification And Release

- [x] 6.1 Run the feedback check, affected auth/trial checks, OpenSpec validation, lint, typecheck, and build.
- [x] 6.2 Run Playwright before archive for desktop and mobile feedback entry/submission states, console health, and text overflow.
- [x] 6.3 Confirm the pre-archive gate is ready; the post-archive commit, push, Docker redeploy, and public smoke checks remain required immediately after archive by project rule.
