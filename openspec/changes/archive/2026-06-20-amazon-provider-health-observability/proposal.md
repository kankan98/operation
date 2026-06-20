## Why

Amazon acquisition already has a compliant Rainforest-first provider path and a browser fallback, but operations still lack a provider-level health view that explains whether failures come from missing credentials, quota/rate limits, marketplace mismatch, parsing gaps, or fallback behavior. This change makes Amazon provider reliability observable enough to diagnose production data gaps and decide whether selection scores are limited by data-source health rather than product fundamentals.

## What Changes

- Add provider observability for Amazon acquisition attempts, including provider health summaries, recent failure distribution, latency, success rate, fallback usage, and last successful acquisition freshness.
- Add safe Rainforest diagnostics that classify credential, quota/rate-limit, timeout, marketplace, missing-price, not-found, and unknown response states without persisting secrets or raw provider payloads.
- Expose provider health through backend service/API contracts and documentation so product detail, operations, and chat tooling can explain Amazon data-source status consistently.
- Add tests and fixtures for provider health aggregation, Rainforest diagnostic mapping, cache/fallback provenance, and OpenAPI/schema coverage.
- Repair current OpenSpec main spec validation debt so the main spec library validates cleanly with no failed specs and no known warning debt.

## Capabilities

### New Capabilities

- `amazon-provider-observability`: Amazon provider health, diagnostic, and operational visibility across Rainforest, browser fallback, cache, and attempt history.

### Modified Capabilities

- `product-data-acquisition`: Acquisition attempts and APIs expose provider health summaries and safe diagnostics for Amazon provider chains.
- `rainforest-amazon-provider`: Rainforest failure mapping and diagnostics become explicit enough to support health aggregation and operator troubleshooting.
- `product-detail-ui`: Product detail displays Amazon provider health and labels browser/cache fallback as degraded acquisition paths.
- `chat-agent-tools`: Chat acquisition explanations include provider health context and avoid treating provider health as demand, sales, or profit evidence.
- `openspec-spec-validation-health`: Main spec validation health now covers warning debt in addition to failed-spec debt.

## Impact

- Backend provider/router/service layer: Rainforest provider diagnostics, scrape attempt aggregation, scraper/provider health service, and REST routes.
- Database/API surface: reuse existing scrape attempts where possible; add migrations only if current diagnostics metadata cannot represent the needed fields safely.
- Frontend/chat surfaces: optional display/consumption of provider health summaries for product detail and acquisition explanations.
- Docs/OpenAPI/tests: update acquisition docs, OpenAPI schemas, unit tests, route tests, and OpenSpec validation evidence.
