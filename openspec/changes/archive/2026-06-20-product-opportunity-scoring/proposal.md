## Why

The platform can now collect and monitor product data, but it still makes users inspect products one by one. Cross-border sellers need a faster way to identify which tracked or candidate products deserve attention, based on price movement, data freshness, review signals, availability, and acquisition reliability.

## What Changes

- Add a product opportunity scoring service that ranks products with a transparent score, factor breakdown, confidence, and recommended action.
- Add API endpoints for listing ranked opportunities and explaining a single product's score.
- Add a product opportunity workbench in the frontend with filters, sort order, score badges, and reason cards.
- Add Chat agent tool support for asking "which products should I look at?" and "why is this product scored this way?"
- Reuse existing product, snapshot, scrape attempt, and price analysis data; do not require new external providers in this change.
- Update route documentation so the roadmap reflects that Rainforest/provider observability is complete and selection scoring is the next step.

## Capabilities

### New Capabilities
- `product-opportunity-scoring`: Scores and ranks products for selection decisions using existing monitoring, price, acquisition, and product metadata signals.

### Modified Capabilities
- `product-module`: Product list UI SHALL expose an opportunity-oriented workbench view for scanning ranked products.
- `chat-agent-tools`: Chat tools SHALL provide product opportunity ranking and score explanation paths.
- `price-analysis`: Price analysis SHALL expose reusable cross-product signal inputs needed by opportunity scoring.

## Impact

- Backend services: new scoring service using `ProductService`, `PriceAnalysisService`, and scrape attempt history.
- Backend routes/schemas: new read-only opportunity endpoints under analysis or a dedicated opportunity route.
- Frontend: product list/workbench UI, API service methods, React Query hooks, localized labels, tests.
- Chat tools: new read-only tool definitions and execution for opportunity rankings and explanations.
- Documentation/OpenSpec: roadmap updates, new capability spec, and modified delta specs.
