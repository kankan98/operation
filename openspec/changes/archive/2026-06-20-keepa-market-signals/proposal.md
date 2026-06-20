## Why

The platform can now collect current listing data and merchant-entered business assumptions, but opportunity scoring still lacks external trend evidence for demand and market movement. Adding a compliant historical market signal provider gives merchants a stronger basis for fast product selection without overstating sales, demand, or profit facts.

## What Changes

- Add a Keepa-backed market signal provider for Amazon products, configured separately from current listing acquisition providers.
- Persist bounded market signal snapshots such as historical price summaries, sales rank trends, review count velocity, rating movement, and data freshness.
- Expose market signal refresh, history, and health through backend services and documented API contracts.
- Feed market trend signals into opportunity scoring as explainable factors with confidence and missing-signal behavior.
- Update product detail, opportunity workbench, and Chat explanations so users can see trend evidence and caveats.
- Keep provider diagnostics safe by redacting API keys and avoiding raw high-cardinality payload persistence.
- No breaking API changes are intended.

## Capabilities

### New Capabilities

- `keepa-market-signals`: Keepa configuration, provider calls, historical market signal normalization, persistence, provider health, diagnostics, and refresh behavior.

### Modified Capabilities

- `product-opportunity-scoring`: Incorporate market trend signals as explicit scoring factors while preserving confidence and missing-signal safeguards.
- `product-module`: Display market signal freshness, trend summaries, and missing signals in product detail and opportunity workflows.
- `chat-agent-tools`: Explain market signals and caveats without claiming verified sales, demand, or profitability.
- `openapi-generation`: Document market signal API responses, provider health examples, and schema extensions.
- `shared-schemas`: Add reusable schemas for market signal snapshots, provider metadata, and opportunity market-signal fields.

## Impact

- Backend configuration, migrations, provider/service layer, scheduled refresh logic, opportunity scoring, API routes, OpenAPI registry, and tests.
- Shared schemas and frontend API/types/hooks.
- Product detail, opportunities workbench, and Chat tool output.
- Documentation for Keepa credential setup, data semantics, diagnostics safety, and scoring caveats.
