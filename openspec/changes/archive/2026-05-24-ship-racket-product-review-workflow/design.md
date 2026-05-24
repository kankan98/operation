## Context

The racket product repository already has local-only server-side source registration, review submission, review decisions, publish gating, and review queue methods. `/rackets` currently exposes only create/list in the browser, so a product can be saved but cannot become a trusted product fact without falling back to repository-only checks.

This change sits in technical roadmap stage 4: core operations persistence. It uses accepted Next.js App Router Route Handlers, the existing app-owned auth cookie/session runtime, PostgreSQL/Drizzle repository methods, and existing `DataAccessContext`. It does not introduce new providers, new tables, Server Actions, source discovery, RAG, queueing, or production authentication.

User value: a product owner can take a racket model from draft to source-backed, reviewed, and published inside the V0 workbench. That makes the first MVP more usable because AI review, talk tracks, and future Q&A can trust published product facts instead of treating every product as a blocked draft.

## Goals / Non-Goals

**Goals:**

- Expose existing source/review/publish repository behavior through protected local-only Route Handlers.
- Extend `/rackets` with an operator-facing source/review/publish lane and review queue.
- Preserve tenant/team scope, CSRF, no-store responses, safe route errors, and repository state gates.
- Add repeatable route and V0 workflow verification with rollback.
- Update durable docs/specs so the runtime boundary is clear.

**Non-Goals:**

- Product editing, alias merge, archive UI, source discovery/import provider, scraping, or automatic source refresh.
- Production login, HTTPS/domain decisions, middleware route protection, team switching, or invitation flows.
- RAG snapshots, Q&A answer generation, real AI calls, queueing, object storage, analytics, or observability provider work.
- New database tables or migrations; current source/review/publish schema is sufficient.
- Server Actions; existing project runtime uses Route Handlers for local V0 browser workflows.

## Decisions

1. **Use existing repository methods rather than adding data model changes.**
   - Rationale: the schema already stores product sources, review decisions, product status, publication audit metadata, and source summaries.
   - Alternative considered: add versioned product snapshot tables now. Rejected because publish currently only needs source-backed readiness; RAG snapshot/versioning belongs to a later retrieval stage.

2. **Add focused Route Handlers under `/api/rackets` using the existing BFF pattern.**
   - Routes:
     - `GET /api/rackets/review-queue`
     - `POST /api/rackets/products/[productId]/sources`
     - `POST /api/rackets/products/[productId]/submit`
     - `POST /api/rackets/review-decisions`
     - `POST /api/rackets/products/[productId]/publish`
   - Rationale: mirrors knowledge lifecycle routes and keeps browser code off database/auth internals.
   - Alternative considered: a single command endpoint. Rejected because separate routes are easier to test, audit, and reason about with permission differences.

3. **Keep one racket CSRF value for product mutations.**
   - Rationale: all actions are product-library mutations and already use `x-operation-csrf: racket-products`.
   - Alternative considered: a second review-specific CSRF value. Rejected for this local V0 scope because it adds client complexity without stronger protection; server-side permission and state gates remain authoritative.

4. **Return product/source/queue views from route helpers, not raw records.**
   - Rationale: browser UI should render only safe view models and source summaries; it should not receive tenant/team ownership internals, raw cookies, database metadata, or cross-team hints.

5. **Make the UI compact and task-oriented.**
   - The workbench keeps the existing page structure, adds a selected-product source form, review queue, action buttons, disabled states, and concise Chinese status copy.
   - It does not add marketing copy, decorative visuals, or internal architecture explanations.

6. **Verification follows TDD at route-check level first.**
   - Add/extend rollback-based checks for missing cookie, missing scope, missing CSRF, successful source registration, review queue, submit, source approval, product approval, publish, invalid transitions, permission denial, redaction, no-store, and cross-team isolation before implementing route/UI behavior.

## Risks / Trade-offs

- **Risk: V0 operator has broad demo permissions, so review and product-owner duties may collapse in internal preview.** → Mitigation: keep permission gates in routes/repository; V0 is explicitly internal demo data, not production role design.
- **Risk: Browser review actions can make demo data too easy to publish.** → Mitigation: require explicit source approval, product approval, and publish action; display readiness blockers and status labels after every action.
- **Risk: Route proliferation increases maintenance.** → Mitigation: centralize preflight/auth/error handling in `apps/web/src/server/rackets/route.ts`, matching the knowledge lifecycle route pattern.
- **Risk: Published product facts could be mistaken for RAG-ready snapshots.** → Mitigation: docs and UI describe publication as product-library readiness only; RAG snapshot remains a later OpenSpec stage.
- **Risk: UI grows dense on mobile.** → Mitigation: use existing responsive grids, wrapping badges, stable buttons, and Playwright pre-archive checks for desktop and mobile.
