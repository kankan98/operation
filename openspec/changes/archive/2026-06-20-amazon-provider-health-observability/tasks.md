## 1. Provider Diagnostics

- [x] 1.1 Define normalized Amazon provider diagnostic fields and a safe diagnostics sanitizer/allowlist.
- [x] 1.2 Update Rainforest failure creation to emit normalized diagnostic codes for missing API key, auth/quota/rate-limit, timeout, not found, missing price, marketplace, and unknown errors.
- [x] 1.3 Ensure diagnostics never persist API keys, credential-bearing URLs, raw HTML, cookies, or raw third-party response payloads.
- [x] 1.4 Preserve primary-provider failure context when browser fallback or cache fallback returns the final acquisition result.

## 2. Provider Health Service

- [x] 2.1 Implement an Amazon provider health aggregation service over `scrape_attempts`.
- [x] 2.2 Aggregate attempt count, success/failure count, success rate, average duration, latest success timestamp, latest failure reason, latest confidence, fallback count, cache count, and failure distribution.
- [x] 2.3 Support bounded query windows and optional product/provider filters.
- [x] 2.4 Return an insufficient-history health state when no matching attempts exist.
- [x] 2.5 Add operator recommendations for missing credentials, quota/rate-limit, high fallback usage, stale success, and repeated unknown failures.

## 3. API And OpenAPI

- [x] 3.1 Add a backend route for Amazon provider health, such as `GET /api/scraper/providers/amazon/health`.
- [x] 3.2 Add request validation for supported query parameters and safe defaults.
- [x] 3.3 Add response schemas for provider summaries, chain summaries, latest attempts, diagnostics, and recommendations.
- [x] 3.4 Register the endpoint and examples in OpenAPI generation.
- [x] 3.5 Ensure API errors use existing response-validation conventions.

## 4. Product And Chat Consumption

- [x] 4.1 Add minimal product-detail or operations UI consumption of provider health if an existing surface can display it without a new dashboard.
- [x] 4.2 Update chat/tool acquisition explanations to distinguish provider health from product opportunity or demand signals.
- [x] 4.3 Label browser fallback and cache fallback as degraded acquisition states.

## 5. Tests

- [x] 5.1 Add Rainforest provider fixture tests for diagnostic mapping and secret redaction.
- [x] 5.2 Add provider health service tests covering Rainforest success, Rainforest failure, browser fallback, cache fallback, insufficient history, and bounded windows.
- [x] 5.3 Add route tests for provider health query validation and response shape.
- [x] 5.4 Add OpenAPI/schema tests for the provider health endpoint.
- [x] 5.5 Run backend lint, build, and relevant unit tests.

## 6. Documentation And OpenSpec Health

- [x] 6.1 Update acquisition documentation with provider health dimensions, diagnostics safety, and recommended remediation steps.
- [x] 6.2 Update roadmap/docs to show Amazon provider observability as the next reliability slice before broader data-source expansion.
- [x] 6.3 Repair current OpenSpec main spec warning debt without changing product behavior.
- [x] 6.4 Run `openspec validate --changes amazon-provider-health-observability`.
- [x] 6.5 Run `openspec validate --specs --json` and record zero failed specs plus no known warning debt.
