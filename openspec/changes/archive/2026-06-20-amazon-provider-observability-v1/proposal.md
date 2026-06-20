## Why

The reliable acquisition layer can now classify failures and record attempts, but Amazon data still depends on the browser fallback and the product UI does not show why collection failed. The next step should make acquisition observable to users and add the first real Amazon data provider so the system can obtain data without relying on protected marketplace pages.

The OpenSpec main spec library also has 14 validation failures. This creates noise around future proposal, sync, and archive work, so the validation debt should be cleared before this feature is considered complete.

## What Changes

- Add a Rainforest-backed Amazon provider that can be ordered before `amazon-browser` in the provider chain.
- Add provider credential/config handling so missing credentials return `provider_unavailable` and automatically fall back to the next provider.
- Map Rainforest responses and errors into the existing structured acquisition result contract.
- Wire the product detail "check now" action to the scraper acquisition API and refresh product, snapshot, job, and attempt state after completion.
- Display recent acquisition attempts on the product detail page with provider, source, status, failure reason, confidence, duration, timestamp, and safe diagnostics.
- Add a Chat agent tool path for explaining a product's latest acquisition status and failures in user-friendly language.
- Fix OpenSpec main spec validation debt so `openspec validate --specs --json` reports zero failed specs.
- No breaking API changes are intended.

## Capabilities

### New Capabilities
- `rainforest-amazon-provider`: Amazon product data acquisition through the Rainforest API provider, including configuration, response mapping, and failure classification.
- `openspec-spec-validation-health`: Validation health requirements for keeping the main OpenSpec spec library clean after archived changes.

### Modified Capabilities
- `product-data-acquisition`: Provider selection SHALL support a real Amazon API provider before browser fallback and preserve provenance for Rainforest results.
- `product-detail-ui`: Product detail SHALL expose manual acquisition status and recent attempt diagnostics to the user.
- `chat-agent-tools`: Chat tools SHALL explain product acquisition status and structured failure reasons.

## Impact

- Backend provider layer: `backend/src/providers/`, acquisition config, scraper service tests.
- Backend API: existing `/api/scraper/product/:productId`, `/api/scraper/product/:productId/attempts`, and `/api/scraper/jobs/:jobId` consumers.
- Frontend product detail: API service methods, React Query hooks, manual check action, attempts panel, loading/error states.
- Chat tools: agent tool definitions and execution for acquisition status explanation.
- Shared schemas/types: scraper result, scrape job, and attempt types consumed by frontend and Chat tools.
- OpenSpec specs: repair invalid main specs and add validation health coverage to prevent recurring spec debt.
