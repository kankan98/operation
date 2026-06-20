## 1. Configuration And Shared Contracts

- [x] 1.1 Add eBay configuration to backend config and `.env.example`, including client ID, client secret, marketplace, API base URL, OAuth base URL, timeout, and diagnostics capture toggle.
- [x] 1.2 Extend backend and shared provider/source types to include `ebay-browse` and `official_api` without breaking existing Amazon values.
- [x] 1.3 Extend bounded diagnostic/root-cause schemas for eBay missing credentials, auth failure, rate limit, quota exhausted, not found, marketplace mismatch, unsupported URL, price missing, timeout, and unknown provider errors.
- [x] 1.4 Add shared schema tests proving existing Amazon responses remain valid and eBay provider metadata validates correctly.

## 2. eBay Provider Core

- [x] 2.1 Implement an eBay OAuth client using client-credentials flow with in-memory token caching and expiry skew.
- [x] 2.2 Add eBay credential, token, authorization header, and URL redaction coverage to provider diagnostic helpers.
- [x] 2.3 Implement deterministic eBay item ID extraction from product metadata and supported eBay item URL patterns.
- [x] 2.4 Implement the `EbayBrowseProvider` with provider `ebay-browse`, source `official_api`, platform support for `ebay`, timeout handling, and safe diagnostics.
- [x] 2.5 Normalize eBay Browse item responses into acquisition data including title, price, currency, availability, image URL, seller, condition, item ID, listing URL, and safe metadata.
- [x] 2.6 Map eBay API/auth/network failures to bounded failure reasons and root causes.
- [x] 2.7 Add eBay provider fixture tests for success, missing credentials, auth failure, rate limit, quota exhausted, not found, marketplace mismatch, unsupported URL, missing price, timeout, malformed response, and redaction.

## 3. Acquisition Router And Persistence

- [x] 3.1 Register `EbayBrowseProvider` in `ScraperService` provider router construction.
- [x] 3.2 Ensure eBay provider order uses `ebay-browse` for eBay products and does not run unapproved browser fallback by default.
- [x] 3.3 Persist eBay scrape attempts with provider, source, status, failure reason, root cause, diagnostics, duration, confidence, and timestamp.
- [x] 3.4 Preserve eBay provenance in successful acquisition results and price snapshot metadata.
- [x] 3.5 Ensure cache fallback works for eBay products and is counted separately from live official API success.
- [x] 3.6 Add router and scraper service tests for eBay success, provider unavailable, failed live provider with fresh cache, and unsupported eBay URL.

## 4. Scraper API And Provider Health

- [x] 4.1 Extend scraper API behavior so manual product acquisition returns eBay success and failure fields through the existing response shape.
- [x] 4.2 Expose eBay provider health using the existing provider health contract and platform scoping.
- [x] 4.3 Add eBay provider health recommendations for missing credentials, auth failure, rate limiting, quota exhaustion, marketplace mismatch, unsupported URL, price missing, and insufficient history.
- [x] 4.4 Add API tests for manual eBay acquisition success, structured failure, health query, product-scoped health, invalid query validation, and insufficient-history state.

## 5. OpenAPI And Documentation

- [x] 5.1 Register eBay provider/source schema extensions in OpenAPI generation.
- [x] 5.2 Add OpenAPI examples for eBay manual acquisition success, provider unavailable/not found failure, healthy provider health, degraded provider health, and insufficient-history health.
- [x] 5.3 Update backend README and acquisition docs with eBay credential setup, marketplace configuration, supported URL formats, diagnostics safety, and remediation flow.
- [x] 5.4 Update roadmap to mark `ebay-browse-provider` as the active P3 implementation slice.

## 6. Product UI, Opportunities, And Chat

- [x] 6.1 Update frontend API/types if needed so eBay provider metadata and health fields render without Amazon-specific assumptions.
- [x] 6.2 Update product detail acquisition status UI to show eBay Browse success, failure, insufficient history, and manual check states.
- [x] 6.3 Update opportunity workbench rendering so eBay products show platform, acquisition health, missing signals, and manual check actions correctly.
- [x] 6.4 Extend Chat acquisition explanations with eBay provider health, safe diagnostics, remediation guidance, and caveats about unsupported demand/profit claims.
- [x] 6.5 Add frontend and Chat tests for eBay provider metadata rendering, eBay degraded states, missing-signal caveats, and no hidden acquisition during explanation.

## 7. Verification

- [x] 7.1 Run backend lint and build.
- [x] 7.2 Run backend targeted tests for eBay provider, provider diagnostics, router, scraper service, scraper API, provider health, OpenAPI, opportunity scoring, and Chat tools.
- [x] 7.3 Run full backend tests.
- [x] 7.4 Run frontend relevant tests and frontend build.
- [x] 7.5 Run `openspec validate --changes ebay-browse-provider --json` and repair any change-spec issues.
- [x] 7.6 Run `openspec validate --specs --json` and keep the main spec library at zero failed specs.
- [x] 7.7 Record validation evidence in `openspec/changes/ebay-browse-provider/VALIDATION.md`.
