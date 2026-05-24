## Why

`/rackets` can create and list product drafts, but operators still cannot move a racket model through source registration, review, and publish from the browser. That blocks the MVP because AI review, talk tracks, and future Q&A need source-backed product facts instead of unreviewed drafts.

Reliable-source check before scope:

- W3C PROV-O is a W3C Recommendation for representing provenance across systems; it centers entities, activities, agents, attribution, derivation, and primary sources, which supports keeping product facts tied to source and reviewer metadata.
- GS1's Data Quality Framework materials describe product data quality as a managed process with data governance, self-assessment, and product/data inspection, which supports adding a compact review workflow before product facts are reused downstream.
- Next.js official Route Handler docs confirm App Router `route.ts` files are the supported place for custom request handlers and support `GET`/`POST`, matching the existing protected BFF/API pattern.

Skill-backed value exploration:

- `openspec-explore`: existing repository methods already implement source, review, publish, and review queue; the highest-value gap is exposing them safely through local-only protected routes and browser workflow.
- `prioritization-advisor`/roadmap framing: this is a high-value, low-new-architecture wave because it completes an existing workflow without adding providers or schema.
- `ui-ux-pro-max`/`frontend-design`: keep the interface dense and operational; surface a review queue and compact forms rather than decorative dashboards.

## What Changes

- Add local-only protected racket source/review/publish Route Handlers for:
  - registering a source on a product;
  - submitting a product for review;
  - listing the review queue;
  - recording source/product review decisions;
  - publishing an approved source-backed product.
- Extend `/rackets` V0 workbench so authenticated operators can select a product, register source metadata, submit for review, approve a source/product, publish it, and see review queue/source summaries.
- Update reference-data helper types and payload builders for the new product review workflow.
- Add repeatable route/V0 verification that proves auth, CSRF, tenant/team scope, state gating, redaction, no-store responses, and rollback.
- Update product library contract, roadmap, and documentation to reflect the new local-only API/browser boundary.

No breaking changes. This wave does not introduce product editing, source discovery/import providers, production login, RAG snapshots, Q&A generation, external AI calls, or new database tables.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `racket-source-review-publish`: promote the existing local-only server-only source/review/publish repository slice to a local-only protected API and V0 browser workflow while keeping production/provider/RAG boundaries out of scope.
- `racket-product-api-runtime`: add protected product review routes beyond create/list with existing auth cookie/session, explicit tenant/team scope, CSRF, safe JSON, and no-store behavior.
- `racket-product-workbench`: add the browser workflow for source registration, review queue, review decisions, and publish actions.
- `operator-v0-reference-data-workflow`: expand V0 reference data verification to cover racket source/review/publish interactions.
- `racket-product-library-contract`: update the contract/runtime boundary to show source/review/publish APIs and V0 UI are implemented locally.

## Impact

- Affected code:
  - `apps/web/src/server/rackets/route.ts`
  - `apps/web/src/app/api/rackets/**/route.ts`
  - `apps/web/src/server/rackets/route-check.ts`
  - `apps/web/src/server/reference-data/operator-v0-check.ts`
  - `apps/web/src/lib/reference-data-v0-workflow.ts`
  - `apps/web/src/components/racket-product-workbench.tsx`
- Affected docs/specs:
  - `docs/contracts/racket-product-library.md`
  - `docs/roadmap/ai-continuous-development-goal.md`
  - `docs/roadmap/autonomous-development-roadmap.md`
  - `openspec/specs/*` after archive
- Dependencies: none.
- Verification:
  - `openspec validate ship-racket-product-review-workflow`
  - `pnpm lint`, `pnpm typecheck`, `pnpm build`
  - local database migration and racket/reference-data checks
  - Playwright pre-archive browser check for `/rackets`
