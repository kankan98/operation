## Why

The platform can now rank products with current listing data, business assumptions, provider health, and Keepa market signals, but merchants still lack a durable workflow for turning scored opportunities into decisions. A research workspace closes the gap between "this looks promising" and "this candidate is ready to compare, export, and act on."

## What Changes

- Add a persistent opportunity research workspace for shortlisted products, including status, priority, notes, tags, and timestamps.
- Add product comparison support so users can compare price, acquisition health, market signals, business assumptions, missing signals, and score factors side by side.
- Add export support for selected or filtered opportunities, with caveats that rank/review signals and business assumptions are not verified sales, demand, margin, ROI, or profitability facts.
- Update the opportunity workbench UI with shortlist actions, tag/status controls, comparison selection, export action, and saved research context.
- Update Chat tools so the assistant can summarize a product's research status and list shortlisted opportunities without silently changing user state.
- Document the API and shared schemas for shortlist, comparison, and export contracts.
- No breaking API changes are intended.

## Capabilities

### New Capabilities

- `opportunity-research-workspace`: Persistent shortlist, tags, notes, comparison, export, and research-status workflows for scored product opportunities.

### Modified Capabilities

- `product-module`: Display and edit opportunity research state in the opportunity workbench and product detail surfaces.
- `product-opportunity-scoring`: Include non-scoring research metadata alongside opportunity responses without changing deterministic score calculation.
- `chat-agent-tools`: Let Chat read and explain opportunity research state and shortlisted candidates while avoiding hidden state mutations.
- `openapi-generation`: Document opportunity research workspace API contracts, examples, export responses, and caveats.
- `shared-schemas`: Add reusable schemas for research status, shortlist entries, comparison results, export requests, and export rows.

## Impact

- Backend database migration for opportunity research entries, tags, comparison/export metadata, and deletion cleanup.
- Backend services and routes for shortlist CRUD, tag/status updates, comparison, and CSV/JSON export.
- Opportunity scoring/list APIs augmented with optional research metadata.
- Frontend opportunity workbench and product detail UI updated with shortlist, compare, tag, notes, and export workflows.
- Chat tools extended for read-only research summaries.
- OpenAPI, shared schemas, documentation, and tests updated across backend and frontend.
