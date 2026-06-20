## Why

Amazon acquisition is now routed through provider chains, but operators still lack enough visibility to tell whether failures come from Rainforest configuration, quota, marketplace mismatch, Amazon blocking, browser fallback degradation, or cache fallback. This change makes provider reliability observable and keeps OpenSpec's main specification library clean while the acquisition roadmap advances.

## What Changes

- Add provider-attempt aggregation for Amazon acquisition health, including success rate, failure distribution, duration, confidence, fallback count, cache count, and last seen diagnostic signals.
- Add safe diagnostic normalization so Rainforest and browser fallback failures can be inspected without leaking API keys, cookies, raw HTML, credential-bearing URLs, or raw provider payloads.
- Add operator-facing recommendations for common Amazon acquisition states such as missing Rainforest credentials, quota/rate limiting, repeated browser fallback, stale cache reliance, and insufficient history.
- Add OpenAPI and maintainer documentation for provider health contracts, diagnostic safety, and operational runbooks.
- Add tests and validation evidence that cover provider health aggregation, diagnostic redaction, API contracts, and OpenSpec main spec health.
- No breaking API changes are intended.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `amazon-provider-observability`: extend Amazon provider health from basic summaries into a diagnostic and remediation surface for Rainforest, browser fallback, cache fallback, and insufficient-history states.
- `product-data-acquisition`: ensure acquisition attempts preserve enough safe provider-chain context for Amazon health aggregation, documentation, and OpenAPI contracts.
- `openspec-spec-validation-health`: require this change to keep the main OpenSpec spec library validating cleanly and to record validation evidence as part of completion.

## Impact

- Backend acquisition services, provider attempt persistence, provider health aggregation, and API routes.
- Rainforest and Amazon browser provider diagnostics, especially failure classification and redaction behavior.
- Shared response schemas and OpenAPI registry for provider health endpoints.
- Tests for provider health aggregation, diagnostic safety, acquisition provenance, OpenAPI generation, and OpenSpec validation.
- Documentation for Amazon provider operations and OpenSpec validation evidence.
