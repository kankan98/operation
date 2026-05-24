## 1. Proposal And Contract Gate

- [x] 1.1 Validate the new OpenSpec change before implementation.
- [x] 1.2 Update the racket product contract and roadmap docs to reflect the planned local-only source/review/publish boundary.

## 2. RED Verification

- [x] 2.1 Add a local rollback verification script for source registration, review decisions, publish gating, permission checks, and cross-team isolation.
- [x] 2.2 Run the new verification and observe the expected RED failure before production implementation exists.

## 3. Data Model And Migration

- [x] 3.1 Add Drizzle enums, product publication audit fields, source table, review decision table, and typed records.
- [x] 3.2 Generate and review the Drizzle migration for the new source/review schema.

## 4. Repository Implementation

- [x] 4.1 Extend racket repository input schemas, views, errors, permissions, source summaries, and state-transition helpers.
- [x] 4.2 Implement `registerRacketSource`, `submitRacketProductForReview`, `recordRacketReviewDecision`, `publishRacketProduct`, and `listRacketReviewQueue`.
- [x] 4.3 Preserve existing product create/list behavior and keep `sourceIds` as a publish-time compatibility summary.

## 5. Verification And Docs

- [x] 5.1 Run local database migration and local rollback checks for data foundation, auth guard, product persistence, and source review publish behavior.
- [x] 5.2 Run lint, typecheck, build, `openspec validate implement-racket-source-review-publish`, and `openspec validate --all`.
- [x] 5.3 Update OpenSpec tasks and durable roadmap/contract notes with final implementation status, skipped Playwright/Docker rationale, and next candidate work.
