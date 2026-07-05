## Purpose

Reliable product data acquisition routes product monitoring through provider chains, records structured attempts, and preserves provenance for collected price data.
## Requirements
### Requirement: Default acquisition to explicit manual checks
Product data acquisition SHALL default to explicit user-triggered single-product checks in manual-first installations.

#### Scenario: Manual single-product check remains available
- **WHEN** a user explicitly requests acquisition for one product
- **THEN** the system SHALL attempt acquisition through the configured provider chain and preserve snapshot source, attempt history, and job diagnostics

#### Scenario: Bulk monitoring acquisition requires opt-in
- **WHEN** the system is running with manual-first default configuration
- **THEN** it SHALL NOT enqueue acquisition jobs for all monitored products unless bulk acquisition is explicitly enabled

#### Scenario: Disabled bulk acquisition preserves existing data
- **WHEN** bulk monitoring acquisition is disabled
- **THEN** the system SHALL NOT delete existing jobs, attempts, snapshots, products, alerts, or research metadata

#### Scenario: Manual readings remain the preferred data path
- **WHEN** automated provider acquisition is unavailable, blocked, or disabled
- **THEN** the product workflow SHALL keep manual price readings available as the preferred data path for user-observed evidence

### Requirement: Route product data acquisition through providers
The system SHALL route product data acquisition through platform-aware providers instead of calling a single scraper implementation directly.

#### Scenario: Select provider for supported platform
- **WHEN** acquisition is requested for a product on a supported platform
- **THEN** the system SHALL select the configured provider chain for that platform

#### Scenario: Return unsupported platform failure
- **WHEN** acquisition is requested for a product whose platform has no configured provider
- **THEN** the system SHALL return a structured failure with reason "unsupported_platform"

#### Scenario: Prefer configured API provider
- **WHEN** an approved API or third-party data provider is configured for the product platform
- **THEN** the system SHALL attempt that provider before browser fallback

#### Scenario: Use browser fallback when primary provider is unavailable
- **WHEN** the primary provider is unavailable and browser fallback is enabled
- **THEN** the system SHALL attempt the browser provider and record the primary provider failure

### Requirement: Return structured acquisition results
The system SHALL return structured acquisition results for both successful and failed data acquisition attempts.

#### Scenario: Successful acquisition result
- **WHEN** product data acquisition succeeds
- **THEN** the result SHALL include product data, provider, source, confidence, duration, timestamp, and success=true

#### Scenario: Failed acquisition result
- **WHEN** product data acquisition fails
- **THEN** the result SHALL include provider, source, failure reason, diagnostic metadata, duration, timestamp, and success=false

#### Scenario: Classify known failure reasons
- **WHEN** acquisition fails due to a known condition
- **THEN** the failure reason SHALL be one of "network_timeout", "blocked", "captcha", "geo_restricted", "not_found", "price_missing", "selector_drift", "provider_unavailable", "unsupported_platform", or "unknown"

### Requirement: Persist scrape jobs
The system SHALL persist scrape jobs so acquisition work can be scheduled, retried, and inspected.

#### Scenario: Create job for product
- **WHEN** a product is queued for acquisition
- **THEN** the system SHALL create or update a scrape job with product ID, status, priority, next run time, attempt count, and max attempts

#### Scenario: Claim due job
- **WHEN** a worker processes due scrape jobs
- **THEN** the system SHALL claim jobs whose next run time is due and whose status allows processing

#### Scenario: Mark job successful
- **WHEN** acquisition succeeds for a job
- **THEN** the system SHALL mark the job as succeeded and store the latest attempt reference

#### Scenario: Schedule retry after retryable failure
- **WHEN** acquisition fails with a retryable reason and attempts remain
- **THEN** the system SHALL schedule the next attempt using exponential backoff with jitter

#### Scenario: Mark job failed after final attempt
- **WHEN** acquisition fails and no attempts remain
- **THEN** the system SHALL mark the job as failed with the final failure reason

### Requirement: Persist scrape attempts
The system SHALL record every provider attempt for diagnostics and auditability.

#### Scenario: Record successful attempt
- **WHEN** a provider returns product data successfully
- **THEN** the system SHALL create a scrape attempt with product ID, provider, source, status, duration, confidence, and timestamp

#### Scenario: Record failed attempt
- **WHEN** a provider fails
- **THEN** the system SHALL create a scrape attempt with product ID, provider, source, failure reason, diagnostic metadata, duration, and timestamp

#### Scenario: Query attempts for product
- **WHEN** attempt history is requested for a product
- **THEN** the system SHALL return attempts ordered by most recent first

### Requirement: Store data provenance on successful snapshots
The system SHALL preserve acquisition provenance when creating price snapshots from acquired data.

#### Scenario: Snapshot includes acquisition metadata
- **WHEN** a price snapshot is created from an acquisition result
- **THEN** the snapshot metadata SHALL include provider, source, confidence, and attempt ID when available

#### Scenario: Product update includes acquisition timestamp
- **WHEN** acquisition succeeds and product data is updated
- **THEN** the product last checked timestamp SHALL reflect the acquisition completion time

### Requirement: Support cached fallback
The system SHALL support cached fallback when fresh acquisition cannot be completed and prior product data is still within the configured freshness window.

#### Scenario: Return cached result within freshness window
- **WHEN** all live providers fail and the latest product data is still fresh enough
- **THEN** the system SHALL return a structured success result with source "cache" and lower confidence than live data

#### Scenario: Do not use stale cache
- **WHEN** all live providers fail and cached product data is older than the configured freshness window
- **THEN** the system SHALL return the live acquisition failure instead of cached success

### Requirement: Prefer Rainforest provider before Amazon browser fallback
The system SHALL prefer a configured Rainforest provider before Amazon browser fallback when acquiring Amazon product data.

#### Scenario: Rainforest configured before browser fallback
- **WHEN** an Amazon product is acquired and provider order is `rainforest,amazon-browser`
- **THEN** the system SHALL attempt `rainforest` before `amazon-browser`

#### Scenario: Rainforest unavailable falls back to browser
- **WHEN** Rainforest is ordered first but unavailable because credentials are missing or invalid
- **THEN** the system SHALL record the Rainforest failure and continue to `amazon-browser` when browser fallback is enabled

#### Scenario: Rainforest success stops provider chain
- **WHEN** Rainforest returns a successful acquisition result
- **THEN** the system SHALL NOT call `amazon-browser` for the same acquisition job

### Requirement: Preserve Rainforest acquisition provenance
The system SHALL preserve Rainforest provenance on successful acquisition results and price snapshots.

#### Scenario: Result includes Rainforest provenance
- **WHEN** Rainforest acquisition succeeds
- **THEN** the acquisition result SHALL include provider `rainforest`, source `third_party`, confidence, duration, timestamp, job ID, and attempt ID when available

#### Scenario: Snapshot metadata includes Rainforest provenance
- **WHEN** a price snapshot is created from Rainforest data
- **THEN** the snapshot metadata SHALL include provider `rainforest`, source `third_party`, confidence, attempt ID, and freshness information

#### Scenario: Attempt history records Rainforest failure
- **WHEN** Rainforest acquisition fails
- **THEN** scrape attempt history SHALL include provider `rainforest`, source `third_party`, status, failure reason, duration, and safe diagnostics

### Requirement: Expose provider health for acquisition
The system SHALL expose provider health summaries for product data acquisition using persisted jobs, attempts, and acquisition diagnostics.

#### Scenario: Query provider health by platform
- **WHEN** provider health is requested for a supported platform
- **THEN** the system SHALL return provider summaries derived from recent scrape attempts for that platform

#### Scenario: Query provider health by product
- **WHEN** provider health is requested for a specific product
- **THEN** the system SHALL include recent attempts and provider-chain outcomes for that product only

#### Scenario: Empty health state
- **WHEN** no acquisition attempts exist for the requested scope
- **THEN** the system SHALL return an empty health summary with status indicating insufficient history instead of failing the request

### Requirement: Preserve provider-chain failure context
The system SHALL preserve safe provider-chain failure context when all live providers fail or a fallback provider succeeds.

#### Scenario: All providers fail
- **WHEN** every live provider in the configured chain fails for an acquisition request
- **THEN** the final acquisition result diagnostics SHALL include each attempted provider, source, failure reason, and sanitized error summary

#### Scenario: Later provider succeeds
- **WHEN** a primary provider fails and a later fallback provider succeeds
- **THEN** the system SHALL preserve the primary provider failure context in diagnostics or attempt history so health aggregation can report fallback usage

#### Scenario: Cache fallback succeeds
- **WHEN** live providers fail and a cache result is returned within the freshness window
- **THEN** provider health SHALL count the result as cache fallback rather than live provider success

### Requirement: Document provider health contracts
The system SHALL document provider health request and response contracts in API documentation.

#### Scenario: OpenAPI includes provider health endpoint
- **WHEN** OpenAPI documentation is generated
- **THEN** it SHALL include the provider health endpoint path, query parameters, response schema, and representative success and insufficient-history examples

#### Scenario: Acquisition docs explain health dimensions
- **WHEN** maintainers read product data acquisition documentation
- **THEN** the documentation SHALL explain success rate, fallback count, cache count, failure distribution, duration, freshness, and diagnostics safety rules

### Requirement: Route acquisition through queue operations
Product data acquisition SHALL route scheduled and manual jobs through the acquisition queue operations layer.

#### Scenario: Enqueue through queue adapter
- **WHEN** a product acquisition job is created
- **THEN** the system SHALL enqueue through the configured queue adapter and persist durable job metadata

#### Scenario: Claim through queue adapter
- **WHEN** a worker processes due acquisition work
- **THEN** the worker SHALL claim jobs through the configured queue adapter and respect lease, backend, provider, and retry constraints

#### Scenario: Preserve attempt provenance
- **WHEN** acquisition succeeds or fails through any queue backend
- **THEN** the system SHALL persist scrape attempts with provider, source, status, duration, confidence, failure reason, safe diagnostics, and attempt timestamp

### Requirement: Preserve multi-worker job safety
Product data acquisition SHALL prevent duplicate live processing of the same active job across workers.

#### Scenario: Prevent duplicate claim
- **WHEN** two workers attempt to claim the same due job
- **THEN** only one worker SHALL receive the running lease for that job

#### Scenario: Recover expired lease
- **WHEN** a running job lease expires because a worker stopped heartbeating
- **THEN** the job SHALL become eligible for retry according to retry and provider-limit rules

#### Scenario: Idempotent completion
- **WHEN** a worker completes a job whose lease is no longer current
- **THEN** the system SHALL avoid overwriting newer job state and SHALL preserve the attempt record for diagnostics

### Requirement: Throttle manual acquisition
Manual product acquisition SHALL be bounded so repeated refreshes do not overwhelm providers or queues.

#### Scenario: Manual refresh within throttle window
- **WHEN** a user requests a manual product check while a recent manual job is pending, running, or inside the throttle window
- **THEN** the system SHALL return the existing job or a throttled response instead of creating duplicate provider work

#### Scenario: Manual refresh after throttle window
- **WHEN** the throttle window has elapsed and provider limits allow work
- **THEN** the system SHALL enqueue a new manual acquisition job

### Requirement: Route eBay acquisition through Browse provider
The system SHALL route eBay product data acquisition through the official eBay Browse provider when it is configured for platform `ebay`.

#### Scenario: Select eBay provider
- **WHEN** acquisition is requested for a product with platform `ebay` and provider order includes `ebay-browse`
- **THEN** the provider router SHALL select `ebay-browse` for the acquisition attempt

#### Scenario: eBay provider unavailable
- **WHEN** eBay credentials are missing or invalid
- **THEN** the acquisition result SHALL include provider `ebay-browse`, source `official_api`, failure reason `provider_unavailable`, and safe diagnostics

#### Scenario: No browser fallback for eBay by default
- **WHEN** eBay Browse provider fails and no approved eBay fallback provider is configured
- **THEN** the provider chain SHALL stop after the official provider and SHALL NOT run an unapproved browser crawler

### Requirement: Preserve eBay acquisition provenance
The system SHALL preserve eBay Browse API provenance on acquisition attempts, product updates, and price snapshots.

#### Scenario: Result includes eBay provenance
- **WHEN** eBay Browse acquisition succeeds
- **THEN** the acquisition result SHALL include provider `ebay-browse`, source `official_api`, confidence, duration, timestamp, job ID, and attempt ID when available

#### Scenario: Snapshot metadata includes eBay provenance
- **WHEN** a price snapshot is created from eBay Browse data
- **THEN** snapshot metadata SHALL include provider `ebay-browse`, source `official_api`, confidence, attempt ID, eBay item ID, and safe freshness information

#### Scenario: Attempt history records eBay failure
- **WHEN** eBay Browse acquisition fails
- **THEN** scrape attempt history SHALL include provider `ebay-browse`, source `official_api`, status, failure reason, duration, root cause, and safe diagnostics

### Requirement: Include eBay in provider health aggregation
The system SHALL aggregate persisted eBay attempts through the same provider health model used by other supported platforms.

#### Scenario: Query eBay provider health
- **WHEN** provider health is requested for platform `ebay`
- **THEN** the system SHALL return eBay provider summaries, recent attempts, failure distributions, root causes, and recommendations from persisted attempts

#### Scenario: Empty eBay health state
- **WHEN** no eBay attempts exist in the requested window
- **THEN** the system SHALL return insufficient-history health instead of failing the request

#### Scenario: eBay cache fallback
- **WHEN** eBay live acquisition fails and fresh cached product data is returned
- **THEN** provider health SHALL count the result as cache fallback rather than official API success

### Requirement: Preserve provider-chain outcome context for health aggregation
The system SHALL preserve safe provider-chain outcome context whenever an Amazon acquisition uses multiple providers or falls back to cached data.

#### Scenario: Primary provider fails and fallback succeeds
- **WHEN** Rainforest fails and `amazon-browser` later succeeds for the same acquisition request
- **THEN** persisted attempt history or final diagnostics SHALL preserve the Rainforest provider, failure reason, root cause, duration, and sanitized summary so health aggregation can report fallback usage

#### Scenario: Live providers fail and cache succeeds
- **WHEN** all live Amazon providers fail and cache fallback returns product data within the freshness window
- **THEN** persisted attempt history or final diagnostics SHALL identify the result as cache fallback and preserve safe failure context for the live providers

#### Scenario: All providers fail
- **WHEN** every configured Amazon provider fails
- **THEN** the final acquisition result SHALL include a safe provider-chain summary with attempted providers, sources, failure reasons, root causes when available, and sanitized messages

### Requirement: Normalize provider attempt diagnostics at persistence boundaries
The system SHALL normalize and sanitize provider diagnostics before persisting acquisition attempts.

#### Scenario: Rainforest diagnostics are normalized
- **WHEN** a Rainforest attempt is recorded
- **THEN** diagnostics SHALL include allowlisted fields such as provider code, root cause, HTTP status, marketplace, credits remaining, duration, and sanitized provider message

#### Scenario: Browser diagnostics are normalized
- **WHEN** an Amazon browser attempt is recorded
- **THEN** diagnostics SHALL include allowlisted fields such as root cause, failure category, duration, selector version when available, and sanitized message

#### Scenario: Unsafe diagnostics are rejected or redacted
- **WHEN** provider diagnostics contain API keys, cookies, raw HTML, credential-bearing URLs, or raw provider payloads
- **THEN** those values MUST be rejected, omitted, or redacted before the attempt is persisted

### Requirement: Distinguish healthy live acquisition from degraded data paths
The system SHALL distinguish healthy live acquisition, browser fallback acquisition, cache fallback acquisition, and failed acquisition in persisted attempts and API-facing results.

#### Scenario: Third-party provider success
- **WHEN** Rainforest returns a successful Amazon acquisition result
- **THEN** the result and attempt SHALL identify provider `rainforest`, source `third_party`, and live acquisition confidence

#### Scenario: Browser fallback success
- **WHEN** `amazon-browser` succeeds after a primary provider failure
- **THEN** the result and attempt SHALL identify provider `amazon-browser`, source `browser`, and degraded fallback context

#### Scenario: Cache fallback success
- **WHEN** cache fallback succeeds after live provider failures
- **THEN** the result SHALL identify source `cache`, lower confidence than live data, freshness age, and the safe live-provider failure context

### Requirement: Keep provider health API documentation in sync with acquisition contracts
The system SHALL document provider health request and response contracts whenever acquisition health fields change.

#### Scenario: OpenAPI documents new health fields
- **WHEN** OpenAPI documentation is generated
- **THEN** it SHALL include root causes, degraded path counters, latest safe attempts, recommendation codes, and insufficient-history examples for the Amazon provider health endpoint

#### Scenario: Maintainer docs explain safety boundaries
- **WHEN** maintainers read the acquisition documentation
- **THEN** the documentation SHALL explain which diagnostics are safe to store or return and which data MUST remain excluded

