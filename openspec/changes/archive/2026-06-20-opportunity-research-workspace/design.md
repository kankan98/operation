## Context

The platform now has current listing acquisition, provider health, business assumptions, Keepa market signals, and an opportunity workbench that ranks products. The remaining workflow gap is product research continuity: users can see ranked candidates, but cannot persist a shortlist, tag decision state, compare products side by side, or export a decision-ready list with caveats.

The workspace must stay aligned with the existing architecture: SQLite + Drizzle, Express routes, shared Zod schemas, React Query hooks, and the current opportunity scoring service. It should not change score math unless explicitly required; research metadata is user workflow state layered next to score outputs.

## Goals / Non-Goals

**Goals:**

- Persist opportunity research state per product: status, priority, notes, tags, owner-neutral timestamps, and archived flag.
- Add APIs for shortlist CRUD, status/tag/note updates, comparison inputs, and CSV/JSON export.
- Add research metadata to opportunity list/explanation responses without affecting deterministic score calculation.
- Update the opportunity workbench to support shortlist actions, tag/status editing, comparison selection, and export.
- Update product detail with the product's research status and notes when present.
- Let Chat read research status and shortlisted candidates, while avoiding hidden state mutations unless a future explicit write tool is designed.
- Preserve caveats about proxy signals and merchant assumptions in comparison/export outputs.

**Non-Goals:**

- Multi-user collaboration, ownership, permissions, or audit history beyond basic timestamps.
- Replacing opportunity scoring or changing scoring weights.
- Automated supplier/order management.
- External spreadsheet integrations beyond local CSV/JSON export.
- Bulk import of research entries from files.

## Decisions

1. Store research state in a product-scoped table.

   Create an `opportunity_research_entries` table keyed by product ID with `status`, `priority`, `tagsJson`, `notes`, `archived`, `createdAt`, and `updatedAt`. A product has at most one active research entry. This keeps workflow state separate from scoring data and avoids mutating product records with transient research metadata.

   Alternative considered: store tags and notes directly on `products`. That is simpler but blurs product identity with research workflow state and makes later archive/research history harder.

2. Keep comparison as a read model, not persisted comparison documents.

   Comparison requests accept product IDs and return current opportunity snapshots plus research metadata. The response is not stored. This avoids stale comparison documents and keeps the first slice small.

   Alternative considered: persistent comparison boards. Useful later, but it introduces board ownership, ordering, and versioning before the core shortlist workflow is proven.

3. Export from the same read model as comparison/listing.

   Export endpoints should reuse opportunity scoring output plus research metadata, producing CSV and JSON rows with explicit caveat fields. Export should support selected product IDs or current filters, capped by a bounded limit.

   Alternative considered: frontend-only CSV export. It is faster but duplicates score/format logic and makes Chat/API reuse harder.

4. Research metadata does not affect opportunity score.

   The score remains deterministic from product, acquisition, market, price, and business signals. Research metadata is returned alongside the score for workflow prioritization but never changes factor contribution.

   Alternative considered: boost scores for shortlisted/high-priority products. That would mix user intent with objective signal ranking and make explanations harder to trust.

5. Chat reads research state first.

   Add read-only Chat tool output for shortlisted opportunities and single-product research status. Avoid write actions in this slice so Chat does not silently change shortlist/tags from an ambiguous prompt.

   Alternative considered: allow Chat to add/remove shortlist entries. That is useful, but it needs explicit confirmation and audit semantics that belong in a later change.

## Risks / Trade-offs

- [Risk] Tags become inconsistent if users type free-form values. -> Mitigation: normalize tags to trimmed lowercase strings, cap count and length, and preserve display order.
- [Risk] Export can be mistaken for verified demand or profit proof. -> Mitigation: include caveat columns for market signals and business assumptions in every export row.
- [Risk] Comparison of many products becomes slow. -> Mitigation: cap comparison product count and batch-load scoring inputs as the existing opportunity service does.
- [Risk] Research state may refer to deleted products. -> Mitigation: delete research entries when deleting products and enforce product ID references.
- [Risk] Product detail and opportunity list can drift if caches are stale. -> Mitigation: invalidate opportunity, product, and research query keys after mutations.

## Migration Plan

1. Add shared schemas and backend types for research entries, upsert/update payloads, comparison responses, and export rows.
2. Add database migration and rollback for `opportunity_research_entries`.
3. Implement a service layer for entry CRUD, tag normalization, comparison assembly, and export formatting.
4. Add routes under `/api/opportunities/research/*` or `/api/opportunities/products/*/research`, keeping existing opportunity endpoints backward compatible.
5. Extend opportunity list/explanation responses with optional research metadata.
6. Update frontend hooks, opportunity workbench UI, product detail UI, and tests.
7. Update Chat read-only tools and documentation.

Rollback: remove the new routes from the router, roll back the migration, and keep opportunity scoring/listing functional without research metadata.

## Open Questions

- Should statuses start with `researching`, `watching`, `rejected`, and `ready`, or should product teams prefer different labels?
- Should CSV export include all factor explanations or only the top reasons and caveats?
- Should archive be a separate status or a boolean flag in the first implementation?
