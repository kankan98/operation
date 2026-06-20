## 1. Configuration, Schemas, And Migration

- [x] 1.1 Add Keepa configuration to backend config and `.env.example`, including API key, API base URL, domain/marketplace, timeout, refresh window, diagnostics capture toggle, and provider enabled flag.
- [x] 1.2 Extend backend and shared provider/source/failure/root-cause/recommendation schemas with `keepa`, `third_party`, `unsupported_product`, `insufficient_history`, and Keepa remediation codes.
- [x] 1.3 Add shared schemas for market signal snapshots, market signal refresh results, market signal provider health, and opportunity market-signal factors.
- [x] 1.4 Add database migration and rollback for market signal snapshots and market signal provider attempts or health inputs.
- [x] 1.5 Add schema and migration tests proving existing acquisition/opportunity responses remain compatible when market signal fields are absent.

## 2. Keepa Provider Core

- [x] 2.1 Implement a Keepa provider client using configured API key, timeout handling, URL construction, and safe request metadata.
- [x] 2.2 Implement deterministic Amazon identifier resolution from product ASIN and safe metadata without title search fallback.
- [x] 2.3 Normalize Keepa product/history fixtures into bounded price trend, sales rank trend, review velocity, rating movement, freshness, confidence, and missing-signal summaries.
- [x] 2.4 Map Keepa auth, quota, rate limit, not found, unsupported product, insufficient history, timeout, malformed response, and unknown errors to bounded failure reasons and root causes.
- [x] 2.5 Add Keepa API key, credential URL, authorization header, and raw payload redaction coverage to diagnostic helpers.
- [x] 2.6 Add Keepa provider fixture tests for success, missing credentials, auth failure, quota exhaustion, rate limit, not found, unsupported product, insufficient history, timeout, malformed response, and redaction.

## 3. Market Signal Persistence And Services

- [x] 3.1 Add a market signal snapshot service for creating, querying latest, and querying bounded product history.
- [x] 3.2 Add a market signal refresh service that calls Keepa, persists successful snapshots, records failed attempts, and returns structured refresh results.
- [x] 3.3 Add market signal provider health aggregation scoped by provider, platform, product, and time window.
- [x] 3.4 Ensure market signal attempts and snapshots preserve provider/source/confidence/duration/timestamp/freshness provenance separately from current listing acquisition attempts.
- [x] 3.5 Add service tests for snapshot persistence, latest/history queries, refresh success, refresh failure, insufficient history, provider health, and empty health state.

## 4. API And OpenAPI

- [x] 4.1 Add backend routes for refreshing product market signals, fetching latest market signals, fetching product market signal history, and querying Keepa market signal provider health.
- [x] 4.2 Add request/response validation for market signal route params and bounded query limits.
- [x] 4.3 Add API tests for refresh success, structured failure, latest snapshot, empty latest state, history limit, provider health, invalid query validation, and unsupported product.
- [x] 4.4 Register market signal schemas and examples in OpenAPI generation, including success, provider unavailable, quota exhausted, unsupported product, degraded health, and insufficient-history examples.
- [x] 4.5 Add OpenAPI tests proving Keepa provider/source enums, market signal schemas, safe diagnostics, and caveats are generated.

## 5. Opportunity Scoring And Chat

- [x] 5.1 Extend opportunity scoring input collection to include latest fresh market signal snapshots for ranked products without one route call per product.
- [x] 5.2 Add explicit scoring factors for price trend stability, sales rank trend, review velocity, rating movement, and market signal freshness.
- [x] 5.3 Ensure stale or missing market signals reduce confidence and add missing signals without silently treating products as bad opportunities.
- [x] 5.4 Extend Chat acquisition/opportunity tools with market signal status, provider health, remediation guidance, and caveats about proxy signals.
- [x] 5.5 Add backend tests for market-signal scoring factors, deterministic scoring, missing/stale signal behavior, and Chat explanations that avoid unsupported sales or demand claims.

## 6. Frontend Product And Opportunity UI

- [x] 6.1 Update frontend API types, shared schema usage, and hooks for market signal refresh, latest snapshot, history, and provider health.
- [x] 6.2 Update product detail to show market signal status, freshness, trend summaries, missing state, refresh action, and safe failure diagnostics.
- [x] 6.3 Update opportunity workbench to show market signal freshness, trend indicators, missing-signal actions, and factor explanations separately from acquisition health and business assumptions.
- [x] 6.4 Add frontend tests for fresh market signals, missing market signals, failed refresh diagnostics, opportunity factor rendering, and refresh actions.

## 7. Documentation And Roadmap

- [x] 7.1 Update backend README and development docs with Keepa credential setup, supported identifier requirements, refresh behavior, diagnostics safety, quota/remediation guidance, and signal caveats.
- [x] 7.2 Update roadmap to mark `keepa-market-signals` as the active P4 implementation slice.
- [x] 7.3 Document why Keepa rank/review signals are proxy trend evidence rather than verified sales, demand, or profitability facts.

## 8. Verification

- [x] 8.1 Run backend lint and build.
- [x] 8.2 Run backend targeted tests for Keepa provider, diagnostics, market signal services, market signal API, provider health, OpenAPI, opportunity scoring, and Chat tools.
- [x] 8.3 Run full backend tests.
- [x] 8.4 Run frontend relevant tests and frontend build.
- [x] 8.5 Run `openspec validate --changes keepa-market-signals --json` and repair any change-spec issues.
- [x] 8.6 Run `openspec validate --specs --json` and keep the main spec library at zero failed specs.
- [x] 8.7 Record validation evidence in `openspec/changes/keepa-market-signals/VALIDATION.md`.
