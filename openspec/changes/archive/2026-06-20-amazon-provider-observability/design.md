## Context

Amazon acquisition currently uses a provider chain that can prefer Rainforest before `amazon-browser` and can fall back to cached product data. Scrape attempts are persisted and a provider health endpoint already exists, but the operational surface needs to become more useful: operators need root-cause grouping, safe drilldown, consistent recommendations, and validation evidence that the OpenSpec main library remains trustworthy while these acquisition changes land.

The implementation should build on existing modules instead of adding a new crawling strategy. The important code paths are the Rainforest provider, Amazon browser provider, provider router, scrape attempt persistence, provider health aggregation, scraper routes, shared scraper schemas, OpenAPI registry, product detail UI, chat tools, and acquisition documentation.

## Goals / Non-Goals

**Goals:**

- Make Amazon provider health explain why acquisition is degraded, not just whether attempts succeeded.
- Preserve safe provider-chain context across Rainforest, browser fallback, and cache fallback so health aggregation can identify primary failures and degraded success paths.
- Expose concise operational recommendations through API, UI, and chat surfaces.
- Keep diagnostic storage and responses free of secrets, raw HTML, cookies, credential-bearing URLs, and raw third-party payloads.
- Add tests and final evidence for `openspec validate --changes amazon-provider-observability --json` and `openspec validate --specs --json`.

**Non-Goals:**

- Add a new Amazon scraping bypass, proxy pool, captcha solver, or unsupported anti-bot circumvention path.
- Treat browser fallback or cache fallback as healthy primary data acquisition.
- Guarantee live Rainforest availability in automated tests.
- Change product opportunity scoring logic except where it consumes already-safe acquisition health signals.

## Decisions

1. Extend existing health aggregation instead of creating a separate observability service.

   `ProviderHealthService` already owns the health contract and has direct access to persisted attempts. Extending it keeps aggregation rules, recommendation logic, and response schemas in one place. The alternative was a parallel observability module, but that would duplicate provider grouping and make API behavior harder to test.

2. Use normalized root-cause codes alongside existing failure reasons.

   Failure reasons such as `provider_unavailable` are useful for workflow retries, but they are too broad for operations. Diagnostics should add safe root-cause codes such as `missing_api_key`, `invalid_key`, `quota_exhausted`, `rate_limited`, `marketplace_mismatch`, `captcha_or_blocked`, `selector_drift`, `cache_only`, and `insufficient_history`. The existing failure reason taxonomy remains the retry contract.

3. Store bounded diagnostic summaries at attempt time.

   Health aggregation should not parse raw provider payloads later. Providers and the router should persist allowlisted diagnostics with bounded string lengths, bounded arrays, and no credential-bearing URLs. This makes later UI/chat/API consumption safer and simpler.

4. Report degraded success separately from primary provider success.

   A successful browser fallback or cache fallback is useful to the user, but it means the primary Amazon provider path is unhealthy or unavailable. Health responses should show live third-party success, browser fallback success, and cache fallback success as separate counters.

5. Prefer low-cardinality observability signals.

   Structured logs and optional metrics should use provider, source, status, failure reason, root cause, marketplace, and fallback type. They should not include product titles, raw URLs, ASIN query strings, request payloads, or user-provided free text.

6. Treat OpenSpec validation as part of completion.

   Because this change modifies acquisition contracts across multiple specs, the final implementation must validate both the change and the main spec library. If `openspec validate --specs --json` is already clean, the task is to preserve that state and record evidence rather than inventing unrelated spec edits.

## Risks / Trade-offs

- Root-cause codes can drift from provider behavior -> Centralize code mapping in provider diagnostics utilities and cover the mapping with fixture tests.
- Diagnostics can leak sensitive data if added ad hoc -> Use allowlist serialization and regression tests that inject API keys, cookies, raw HTML, and credential-bearing URLs.
- Aggregated health can overstate demand or product viability -> API, UI, and chat copy must state that provider health measures data-source reliability only.
- Too many metrics labels can create noisy telemetry -> Keep labels low-cardinality and put high-detail debugging data only in bounded, sanitized attempt diagnostics.
- Existing attempts may lack root-cause diagnostics -> Health aggregation must handle older records as `unknown` or `insufficient_diagnostics` without failing.

## Migration Plan

1. Add or extend shared schemas for provider root causes, degraded success counters, latest safe attempts, and recommendations.
2. Extend Rainforest and Amazon browser diagnostics to emit normalized, bounded, safe metadata.
3. Extend provider-chain recording so primary failures, fallback successes, and cache fallback outcomes are preserved for health aggregation.
4. Update provider health API, OpenAPI examples, UI/chat consumers, and documentation.
5. Add fixture-based tests for aggregation, redaction, recommendations, OpenAPI, and no-live-provider behavior.
6. Run backend/frontend targeted tests plus OpenSpec change and main spec validation.

Rollback is straightforward because the change should be additive at the API/schema level. If a deployment issue appears, revert the health response extensions while preserving raw attempt recording and keep the previous provider chain behavior.
