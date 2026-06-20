## Context

Amazon acquisition currently routes through a provider chain where Rainforest is preferred before browser fallback, and each scrape attempt records provider, source, status, failure reason, duration, confidence, timestamp, and JSON diagnostics. Product detail already exposes recent attempts, and opportunity scoring consumes the latest attempt as an acquisition-health signal.

The remaining gap is operational visibility. When Amazon data is missing or stale, the system cannot quickly answer whether the cause is missing Rainforest configuration, quota/rate limits, timeout, marketplace mismatch, parser drift, browser fallback usage, cache fallback, or a product-level not-found state. The design should improve diagnosis without encouraging brittle anti-bot scraping or storing unsafe third-party payloads.

## Goals / Non-Goals

**Goals:**

- Provide an Amazon provider health summary that aggregates recent attempts by provider, source, status, failure reason, latency, confidence, and freshness.
- Preserve safe diagnostic details for Rainforest and provider-chain fallback decisions.
- Expose provider health through backend contracts that product detail, operations views, and chat tools can consume consistently.
- Keep the implementation compliant by prioritizing Rainforest/API visibility and treating browser fallback as a monitored last resort.
- Repair current OpenSpec main-spec warning debt and require validation evidence for future implementation.

**Non-Goals:**

- Build proxy pools, captcha bypass, account automation, or other anti-bot evasion flows.
- Replace Rainforest with a different Amazon data provider in this change.
- Add sales velocity, demand history, Keepa, or profit-margin scoring signals.
- Create a full observability stack such as Prometheus/Grafana before the app has a stable provider health contract.

## Decisions

### Decision: Aggregate health from persisted attempts first

Use `scrape_attempts` as the first source of truth for provider health. A backend service can aggregate recent attempts by platform/provider and return success rate, failure distribution, latency percentiles or averages, last success timestamp, last failure reason, fallback/cache counts, and sample safe diagnostics.

Alternative considered: introduce a separate provider metrics table immediately. That would make time-series aggregation easier later, but it adds schema and write-path complexity before the useful dimensions are proven. A dedicated table remains a follow-up if attempt volume grows or dashboard queries become too expensive.

### Decision: Keep diagnostics structured and safe

Rainforest diagnostics should use normalized fields such as `providerErrorCode`, `httpStatus`, `marketplace`, `creditsRemaining`, `creditsUsed`, `providerMessage`, `providerErrorsSummary`, and `fallbackProviders`. The implementation must not store API keys, request URLs containing credentials, raw HTML, raw third-party payloads, cookies, or personally sensitive data.

Alternative considered: store raw provider responses for easier debugging. That would speed local diagnosis but creates privacy, credential, and storage risk. Fixtures can preserve representative response shapes for tests instead.

### Decision: Expose health through backend API before UI polish

Add a backend health endpoint/service contract first, then wire minimal frontend/chat consumers only after the data shape is stable. Suggested REST shape:

- `GET /api/scraper/providers/amazon/health`
- Optional query fields: `windowHours`, `productId`, `provider`
- Response fields: platform, window, providerSummaries, chainSummary, latestAttempts, recommendations

Alternative considered: only enhance product detail attempt cards. That helps single-product debugging but does not answer whether Amazon acquisition is broadly unhealthy.

### Decision: Classify browser fallback and cache as observability states

The health summary should make fallback usage visible. Browser fallback attempts indicate the API provider was unavailable or insufficient; cache successes indicate the user saw a degraded but usable result. Both need separate counts so operators do not mistake fallback/cache behavior for healthy live provider coverage.

Alternative considered: count only final acquisition outcome. That hides upstream provider problems when a later fallback succeeds.

## Risks / Trade-offs

- Provider diagnostics may expose sensitive data if copied directly from external payloads -> Use an allowlist serializer and tests that reject API keys, full URLs with query strings, raw HTML, and oversized payloads.
- Aggregating directly from `scrape_attempts` could become slow as attempt history grows -> Add bounded default windows, indexes only if profiling shows need, and keep future metrics-table migration possible.
- Health scores can be misread as product demand/quality scores -> Label them as data-source health and keep opportunity scoring signals separate.
- Browser fallback may appear as a recommended recovery path -> Show it as diagnostic/degraded fallback only, not as the primary Amazon data strategy.

## Migration Plan

1. Implement provider-health aggregation on top of existing attempts and diagnostics.
2. Add or adjust diagnostics serialization in Rainforest and router failure paths.
3. Add API/OpenAPI schemas and tests for health summaries.
4. Add minimal UI/chat consumption where existing surfaces already discuss acquisition health.
5. Repair OpenSpec warning debt and run `openspec validate --specs --json`.

Rollback is straightforward if no schema migration is needed: remove the new route/service and diagnostics fields remain harmless JSON metadata. If a migration is required for indexes, provide a rollback that drops only newly added indexes/columns.

## Open Questions

- Should the first UI surface be product detail, a small operations page, or chat-only explanation?
- What default health window is most useful for local development and production: 24 hours, 7 days, or configurable by environment?
- Do we want alert rules for provider health in this change, or only expose the health data needed to add alerts later?
