## ADDED Requirements

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
