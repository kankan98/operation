## Context

The current racket product persistence slice is local-only and server-only. It can create and list tenant/team-scoped products and aliases, reject duplicate models and alias conflicts, and report downstream readiness from product status.

The missing boundary is provenance and human approval. `racket_products.sourceIds` is currently a JSON list, which is enough to represent "some source reference exists" but not enough to enforce trust level, review state, freshness, reviewer decisions, or publish gating. Future AI/RAG must only ground on published product records, so this slice needs a normalized source/review model before any public API, Server Action, UI save flow, source discovery provider, or AI snapshot exists.

This is stage 4 local workflow persistence work on top of the accepted stage 2/3 local auth and data foundations. It uses existing PostgreSQL, Drizzle migrations, Zod validation, server-only repository modules, and `DataAccessContext`.

## Goals / Non-Goals

**Goals:**
- Add local-only, server-only source registration for racket products.
- Add local-only human review decision records for products and sources.
- Enforce product publication only after a product is approved and at least one source is approved in the same tenant/team.
- Keep tenant/team scope and actor audit metadata on every source, review, and publish operation.
- Provide a scoped review queue/readiness view so reviewers can see why a product is blocked.
- Add rollback-based verification that proves state transitions, permissions, cross-team isolation, and publish gating.
- Update contracts, specs, and roadmaps so future agents know what is implemented and what remains out of scope.

**Non-Goals:**
- No public API, Route Handler, Server Action, form save flow, or frontend UI change.
- No AI provider, RAG snapshot, vector table, web discovery, scraping, queue, object storage, or external source adapter.
- No production database provider, connection pool, backup/restore, or hosted auth provider decision.
- No attempt to replace `sourceIds` immediately; normalized source rows become authoritative for this slice while `sourceIds` remains a compatibility/readiness summary.
- No bulk import or CSV dry-run.

## Decisions

### Normalize sources and review decisions

Add `racket_product_sources` and `racket_review_decisions` instead of storing more JSON on `racket_products`.

Rationale:
- Source state, trust level, refresh policy, retrieved time, and reviewer decisions are separate facts with their own audit trail.
- PostgreSQL can enforce tenant/team foreign keys and scoped uniqueness more reliably than ad hoc JSON checks.
- The shape mirrors the product contract and keeps future knowledge lifecycle/RAG integration from depending on a lossy array.

Alternatives considered:
- Keep only `sourceIds` as JSON: smaller now, but cannot enforce source review, trust, freshness, or reviewer audit.
- Create a generic `knowledge_sources` table now: too broad for this slice and would blur product-specific publish rules with the later knowledge lifecycle work.

### Keep `sourceIds` as compatibility summary

When a product is published, store approved source IDs back into `racket_products.sourceIds`.

Rationale:
- Existing product views and readiness logic already expose `sourceIds`.
- This avoids breaking the existing local persistence check while letting normalized source rows become the authoritative source boundary.
- A later knowledge/RAG slice can migrate snapshot generation away from product-local summary fields.

Alternatives considered:
- Remove `sourceIds`: unnecessary churn and breaks current contract examples.
- Continue writing arbitrary caller-provided IDs: unsafe because publish readiness would trust IDs that may not belong to the team or be reviewed.

### Repository-owned state transitions

State transitions are implemented only through repository methods:

```text
needs_source/draft -> reviewing -> approved -> published
reviewing -> rejected
reviewing -> conflict
approved -> conflict
published -> stale/archived (future)
```

For this slice:
- `registerRacketSource` creates a pending source linked to a product.
- `submitRacketProductForReview` moves source-backed draft/needs_source products to `reviewing`.
- `recordRacketReviewDecision` records reviewer intent and updates source or product state.
- `publishRacketProduct` requires product `approved` and at least one approved source, then sets `published`.
- `listRacketReviewQueue` returns scoped products requiring review or publication work.

Rationale:
- UI and future Server Actions should not manually update `status`.
- Review and publication are business rules, not raw update operations.

Alternatives considered:
- Allow `createRacketProduct` to set `published`: too risky because caller-provided status could bypass review.
- Put state machine only in database constraints: PostgreSQL cannot easily express this workflow without complex triggers, and repository checks are easier to test locally.

### Permission mapping

Use existing permissions:
- `manage_products` for source registration and submitting a product for review.
- `review_knowledge` for review decisions and publication.
- `read_workspace`, `manage_products`, or `review_knowledge` for listing the review queue.

Rationale:
- No new permission enum or role migration is needed.
- Reviewer/admin already carry `review_knowledge`; product owners can prepare products but cannot approve/publish them by themselves unless granted reviewer permission.

Alternatives considered:
- Add `review_products`: more precise, but it adds auth schema churn before the project has real provider/login runtime.

### No dependency changes

Use existing Drizzle, PostgreSQL, Zod, and local scripts.

Rationale:
- The problem is schema and business state, not a library gap.
- Avoids dependency, license, bundle, and maintenance expansion.

## Risks / Trade-offs

- [Risk] Product and source review is local-only, so users still cannot save or publish through the UI. -> Mitigation: keep docs/specs explicit; defer public CRUD until auth provider/login and API/Server Action slices.
- [Risk] `sourceIds` and normalized source rows can diverge. -> Mitigation: repository publish writes approved normalized source IDs into `sourceIds`; future writes should not accept arbitrary source IDs as publish proof.
- [Risk] `review_knowledge` is broader than product review. -> Mitigation: document the mapping and defer finer permission names to a dedicated auth change.
- [Risk] Review decisions can target missing or cross-team records if repository checks are incomplete. -> Mitigation: every repository method must query target records by `tenantId` and `teamId`, with rollback verification for cross-team isolation.
- [Risk] Migration adds tables to a dirty local development database. -> Mitigation: generate Drizzle migration, run local migration, run rollback checks, and keep public preview unchanged.
- [Risk] Source freshness policy is modeled but not executed. -> Mitigation: store retrieved time and refresh policy now; actual refresh jobs remain a later source discovery/queue change.

## Migration Plan

1. Add Drizzle enums/tables/columns for product sources, review decisions, and publication audit fields.
2. Generate a new migration with `pnpm db:generate`.
3. Add or extend a local rollback check script before production implementation and observe the expected RED failure.
4. Implement repository methods and state transition helpers.
5. Run local migration and verification:
   - `DATABASE_URL=... pnpm db:migrate`
   - `DATABASE_URL=... pnpm rackets:check`
   - new source/review check if added separately
   - `DATABASE_URL=... pnpm db:check`
   - `DATABASE_URL=... pnpm auth:check`
   - `pnpm lint`
   - `pnpm typecheck`
   - `pnpm build`
   - `openspec validate --all`
6. Do not rebuild Docker unless a later public/frontend change makes it necessary.

Rollback path:
- Before production/public usage, rollback is a local migration and code revert.
- Because no public API/UI writes use these tables, removing the local slice does not strand user-entered production data.
