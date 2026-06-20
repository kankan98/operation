## 1. Schemas And Migration

- [x] 1.1 Add shared schemas and frontend/backend exported types for research entries, research update payloads, comparison requests/responses, export requests, and export rows.
- [x] 1.2 Add backend request/response schemas for opportunity research routes, including status, priority, normalized tags, notes, selected product IDs, format, filters, and bounded limits.
- [x] 1.3 Add database migration and rollback for `opportunity_research_entries`, including product foreign key cleanup, timestamps, archived flag, status, priority, tags JSON, and notes.
- [x] 1.4 Add schema and migration tests for optional research metadata compatibility, tag normalization limits, notes bounds, comparison limits, and export request validation.

## 2. Research Workspace Service And API

- [x] 2.1 Implement an opportunity research service for create/update, get by product, list entries, archive/delete, tag normalization, and product deletion cleanup.
- [x] 2.2 Implement comparison assembly that batch-loads opportunity explanations for selected products and includes research metadata without changing score or factor contributions.
- [x] 2.3 Implement CSV and JSON export generation for selected product IDs or bounded filters, including caveat fields and deterministic column ordering.
- [x] 2.4 Add backend routes for product research entry CRUD, shortlist listing/filtering, comparison, and export.
- [x] 2.5 Extend opportunity list and single-product explanation responses with optional research metadata and filters for shortlisted state, research status, and tag.
- [x] 2.6 Add backend API/service tests for create/update idempotency, status/tag/note updates, archive/delete, product-not-found, comparison limit, export limits, caveats, and score determinism.

## 3. Chat And OpenAPI

- [x] 3.1 Extend Chat agent tools with read-only research status and shortlisted opportunity summaries.
- [x] 3.2 Ensure Chat explains missing research entries and refuses hidden research mutations until an explicit write workflow exists.
- [x] 3.3 Register opportunity research schemas, comparison examples, export examples, and caveat examples in OpenAPI generation.
- [x] 3.4 Add Chat and OpenAPI tests for read-only shortlist output, filtered shortlist summaries, no hidden mutations, schema registration, and export caveats.

## 4. Frontend Research Workflow

- [x] 4.1 Add frontend API methods and React Query hooks for research entry CRUD, shortlist filters, comparison, and export.
- [x] 4.2 Update the opportunity workbench to show shortlist status, priority, tags, and notes alongside score, confidence, acquisition health, market signals, and business assumptions.
- [x] 4.3 Add shortlist actions, status/tag/priority/note editing, comparison selection, comparison table, and export action states.
- [x] 4.4 Update product detail to display research metadata and offer add-to-workspace action when no entry exists.
- [x] 4.5 Add frontend tests for adding to shortlist, editing research metadata, filtering by research status/tag, comparison selection limits, export action, and product detail research state.

## 5. Documentation And Roadmap

- [x] 5.1 Update backend README/API docs with research workspace endpoints, limits, export formats, and caveat semantics.
- [x] 5.2 Update development docs with opportunity research workflow design, tag normalization, export safety, and Chat read-only behavior.
- [x] 5.3 Update roadmap to mark Keepa market signals completed and `opportunity-research-workspace` as the active next slice for turning scored candidates into actionable product research.

## 6. Verification

- [x] 6.1 Run backend lint and build.
- [x] 6.2 Run backend targeted tests for research service, research API, opportunity scoring, Chat tools, OpenAPI, shared schemas, and product deletion cleanup.
- [x] 6.3 Run full backend tests.
- [x] 6.4 Run frontend relevant tests and frontend build.
- [x] 6.5 Run `openspec validate --changes opportunity-research-workspace --json` and repair any change-spec issues.
- [x] 6.6 Run `openspec validate --specs --json` and keep the main spec library at zero failed specs.
- [x] 6.7 Record validation evidence in `openspec/changes/opportunity-research-workspace/VALIDATION.md`.
