## Why

The opportunity scoring MVP can rank products from available monitoring and acquisition signals, but it still cannot answer the merchant's most important selection question: whether a product can make money after cost, shipping, fees, ads, and tax buffers. This change adds explicit business inputs and deterministic margin/ROI calculations so the platform moves from "interesting products" toward "actionable product selection" without inventing unavailable demand or sales facts.

## What Changes

- Add merchant-entered business signal assumptions for product cost, inbound shipping, outbound/FBA fulfillment, platform fees, referral fees, advertising cost, tax/customs buffer, target sell price, and optional target units.
- Compute gross margin, net margin, ROI, breakeven sell price, contribution profit per unit, and assumption completeness when enough inputs exist.
- Integrate business signals into opportunity scoring as transparent factors with confidence changes and missing-signal caveats.
- Expose business signal inputs and computed metrics through shared schemas, backend APIs, product detail, opportunity workbench, and Chat opportunity explanations.
- Keep all profit, ROI, and demand explanations bounded by the assumptions provided by the merchant; do not present calculated values as platform-verified sales, demand, or fee facts.

## Capabilities

### New Capabilities

- `opportunity-business-signals`: Merchant-provided business assumptions and derived margin/ROI metrics for product selection workflows.

### Modified Capabilities

- `product-opportunity-scoring`: Opportunity scoring uses margin/ROI metrics when available and explains missing business assumptions when unavailable.
- `product-module`: Product detail and opportunity workbench display and edit business assumptions and derived product-selection metrics.
- `chat-agent-tools`: Chat opportunity explanations include business assumptions, computed margin/ROI, and caveats when signals are incomplete.
- `shared-schemas`: Shared Zod schemas cover business signal request/response contracts and derived metrics.
- `openapi-generation`: OpenAPI documentation exposes business signal APIs and opportunity response extensions.

## Impact

- Backend data model: add a product-level business assumptions table or equivalent persisted model with migrations and rollback.
- Backend services/API: add CRUD/read endpoints for business signals, calculation helpers, opportunity scoring integration, and Chat tool consumption.
- Shared/frontend: add shared schemas/types, API client methods, product detail editing UI, opportunity workbench columns/filters, and tests.
- Documentation/tests: update product opportunity docs, OpenAPI coverage, unit tests for financial calculations, route tests, frontend tests, and OpenSpec validation.
