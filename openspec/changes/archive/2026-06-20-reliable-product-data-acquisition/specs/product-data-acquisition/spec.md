## ADDED Requirements

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

