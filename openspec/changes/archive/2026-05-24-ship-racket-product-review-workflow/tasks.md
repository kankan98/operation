## 1. Protected API Runtime

- [x] 1.1 Extend racket route helper types, preflight, safe responses, request parsing, and handlers for review queue, source registration, submit, review decisions, and publish.
- [x] 1.2 Add Next.js Route Handler files for `/api/rackets/review-queue`, `/api/rackets/review-decisions`, `/api/rackets/products/[productId]/sources`, `/submit`, and `/publish`.
- [x] 1.3 Extend `rackets:route-check` with failing-first coverage for source/review/publish route success, state gates, CSRF, permissions, cross-team isolation, no-store, redaction, and rollback.

## 2. V0 Workflow Helpers And UI

- [x] 2.1 Extend reference-data helper types, labels, default drafts, payload builders, and response types for racket source/review/publish workflow.
- [x] 2.2 Extend `/rackets` workbench with selected product state, source form, review queue loading, source/product approval actions, publish action, disabled/loading/error/success states, and compact Chinese copy.
- [x] 2.3 Extend V0 reference-data workflow verification for create/list/source/review/publish behavior and safe rollback.

## 3. Documentation And Roadmap

- [x] 3.1 Update product library contract and contract index to describe local-only protected source/review/publish API and V0 browser workflow boundaries.
- [x] 3.2 Update roadmap/goal documents to reflect `/rackets` source/review/publish progress and remaining exclusions.

## 4. Verification And Release

- [x] 4.1 Run OpenSpec validation and targeted local checks for the active change.
- [x] 4.2 Run lint, typecheck, build, migration, racket/reference-data checks, and git diff hygiene.
- [x] 4.3 Run Playwright pre-archive browser verification for `/rackets` desktop/mobile.
- [x] 4.4 Archive the OpenSpec change, commit with Conventional Commits, push, deploy Docker preview, and verify public preview health.
