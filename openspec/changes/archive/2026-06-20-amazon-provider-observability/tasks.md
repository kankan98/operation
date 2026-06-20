## 1. Diagnostic Contracts

- [x] 1.1 Extend shared scraper/provider health schemas with Amazon root-cause codes, degraded path counters, latest safe attempt drilldown fields, and recommendation codes.
- [x] 1.2 Add or update backend TypeScript types for normalized provider diagnostics, provider-chain summaries, and cache/browser fallback context.
- [x] 1.3 Centralize diagnostic allowlist/redaction helpers for API keys, cookies, raw HTML, credential-bearing URLs, raw provider payloads, and oversized messages.
- [x] 1.4 Add fixture tests for diagnostic redaction and bounded serialization.

## 2. Provider And Acquisition Recording

- [x] 2.1 Update Rainforest diagnostics to emit normalized root causes for missing key, invalid key, quota exhausted, rate limited, missing price, not found, timeout, marketplace mismatch, and unknown provider errors.
- [x] 2.2 Update Amazon browser fallback diagnostics to emit safe root causes for captcha, blocked access, geo restriction, selector drift, timeout, and unknown failures.
- [x] 2.3 Preserve primary provider failure context when a later provider succeeds in the same Amazon acquisition request.
- [x] 2.4 Preserve live-provider failure context and freshness age when cache fallback succeeds.
- [x] 2.5 Ensure persisted scrape attempts and final acquisition results reject or redact unsafe diagnostics before storage.

## 3. Provider Health Aggregation

- [x] 3.1 Extend `ProviderHealthService` to aggregate Amazon health by provider, source, failure reason, root cause, marketplace, fallback type, and bounded time window.
- [x] 3.2 Add degraded-path classification for primary Rainforest success, browser fallback success, cache fallback success, all-provider failure, and insufficient history.
- [x] 3.3 Generate remediation recommendations for missing credentials, invalid key, quota/rate limits, repeated browser fallback, cache-dominant windows, browser blocking, and insufficient history.
- [x] 3.4 Emit low-cardinality structured logs or metrics for provider attempts and health aggregation without high-cardinality or sensitive labels.
- [x] 3.5 Keep older scrape attempts without root-cause diagnostics compatible by mapping them to `unknown` or `insufficient_diagnostics`.

## 4. API, OpenAPI, UI, And Chat Surfaces

- [x] 4.1 Update the Amazon provider health API response to include root causes, degraded path counters, latest safe attempts, and recommendation details.
- [x] 4.2 Update OpenAPI schemas and examples for `/api/scraper/providers/amazon/health`, including healthy, degraded, cache fallback, and insufficient-history examples.
- [x] 4.3 Update product detail provider health UI to show degraded path counters, top root causes, and concise remediation copy.
- [x] 4.4 Update chat tools that explain acquisition/provider health so they describe data-source reliability without implying demand, sales volume, or margin evidence.
- [x] 4.5 Update acquisition and operator documentation with diagnostic safety rules, root-cause meanings, and recommended remediation flow.

## 5. Tests And Validation

- [x] 5.1 Add provider health service tests covering Rainforest success, Rainforest primary failure, browser fallback, cache fallback, all-provider failure, insufficient history, and legacy attempts without root causes.
- [x] 5.2 Add Rainforest and browser provider fixture tests covering diagnostic root-cause mapping without live Rainforest or Amazon calls.
- [x] 5.3 Add API and OpenAPI tests for new Amazon provider health response fields and examples.
- [x] 5.4 Add frontend tests for product detail provider health rendering and degraded/cached states.
- [x] 5.5 Run backend targeted tests for provider health, scraper service, Rainforest provider, scraper API, OpenAPI, and chat tools.
- [x] 5.6 Run frontend targeted tests for product detail provider health surfaces.
- [x] 5.7 Run `openspec validate --changes amazon-provider-observability --json` and repair any change-spec issues.
- [x] 5.8 Run `openspec validate --specs --json`; if main spec validation debt appears, repair it or explicitly split it into a separate approved change.
- [x] 5.9 Record final validation evidence showing the active change and main spec library both validate cleanly.
