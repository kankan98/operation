## 1. OpenSpec Validation Debt

- [x] 1.1 Capture current `openspec validate --specs --json` failures and list the 14 failing specs in implementation notes
- [x] 1.2 Repair specs missing `## Purpose` and `## Requirements` sections without changing requirement intent
- [x] 1.3 Repair requirements missing SHALL/MUST wording in `message-enhancement`, `session-grouping`, `task-management-api`, and `task-overview-panel`
- [x] 1.4 Run `openspec validate --specs --json` and confirm zero failed specs before feature implementation proceeds

## 2. Rainforest Provider Configuration

- [x] 2.1 Add Rainforest acquisition config for API key, marketplace, timeout, and safe diagnostics controls
- [x] 2.2 Update backend environment examples and documentation with Rainforest provider settings
- [x] 2.3 Ensure missing `RAINFOREST_API_KEY` produces `provider_unavailable` instead of startup failure
- [x] 2.4 Update provider order documentation to recommend `rainforest,amazon-browser`

## 3. Rainforest Provider Implementation

- [x] 3.1 Create Rainforest provider implementing the existing `ProductDataProvider` contract
- [x] 3.2 Resolve Amazon identifier input from ASIN and product URL where possible
- [x] 3.3 Map successful Rainforest product responses into `ScrapedProductData`
- [x] 3.4 Map Rainforest missing price, not found, timeout, invalid key, quota, and unknown errors to structured acquisition failures
- [x] 3.5 Register Rainforest in the provider router before `amazon-browser` when configured
- [x] 3.6 Ensure Rainforest attempts record provider `rainforest`, source `third_party`, confidence, duration, and safe diagnostics

## 4. Backend Tests and API Contracts

- [x] 4.1 Add Rainforest provider fixture tests with no real Rainforest or Amazon network calls
- [x] 4.2 Add provider router tests for Rainforest success, unavailable fallback, and browser fallback ordering
- [x] 4.3 Add scraper service tests confirming snapshot metadata includes Rainforest provenance
- [x] 4.4 Update shared scraper schemas/types if frontend needs typed scrape result, job, and attempt responses
- [x] 4.5 Run targeted backend provider and scraper tests

## 5. Product Detail Acquisition Observability

- [x] 5.1 Add frontend API methods for `POST /api/scraper/product/:productId`, `GET /api/scraper/product/:productId/attempts`, and `GET /api/scraper/jobs/:jobId`
- [x] 5.2 Replace the stale product `checkNow` path with the scraper acquisition API
- [x] 5.3 Add React Query hooks or equivalent state for manual acquisition, recent attempts, and optional job status lookup
- [x] 5.4 Wire the product detail "check now" button to manual acquisition with loading, success, and structured failure states
- [x] 5.5 Refresh product details, price stats, snapshots, and attempt history after manual acquisition
- [x] 5.6 Add a recent acquisition attempts panel with provider, source, status, failure reason, confidence, duration, timestamp, and safe diagnostics
- [x] 5.7 Add product detail UI tests for successful check, failed check, empty attempts, and attempt list rendering

## 6. Chat Acquisition Explanation

- [x] 6.1 Add a Chat agent tool definition for reading product acquisition status from recent attempts and job state
- [x] 6.2 Implement tool execution that explains latest success, latest failure, and no-attempt states
- [x] 6.3 Ensure Chat does not trigger acquisition while only explaining existing status
- [x] 6.4 Allow explicit user requests to check or refresh a product to call the manual acquisition path
- [x] 6.5 Add tests for captcha, blocked, provider unavailable, selector drift, and no-attempt explanations

## 7. Final Validation

- [x] 7.1 Run `pnpm --filter backend lint`
- [x] 7.2 Run `pnpm --filter backend build`
- [x] 7.3 Run `pnpm --filter backend test`
- [x] 7.4 Run relevant frontend tests for product detail and Chat tool rendering
- [x] 7.5 Run `openspec validate --changes amazon-provider-observability`
- [x] 7.6 Run `openspec validate --specs --json` and confirm zero failed specs
- [x] 7.7 Update docs or README entries if implementation changes config names, provider order, or user-visible behavior
