## ADDED Requirements

### Requirement: Configure Keepa market signal provider
The system SHALL configure Keepa market signal acquisition separately from current listing acquisition providers.

#### Scenario: Missing Keepa credentials
- **WHEN** a market signal refresh is requested and Keepa credentials are not configured
- **THEN** the system SHALL return a structured failure with provider `keepa`, source `third_party`, failure reason `provider_unavailable`, and root cause `missing_credentials`

#### Scenario: Redact Keepa diagnostics
- **WHEN** Keepa authentication or API diagnostics are recorded
- **THEN** diagnostics SHALL redact API keys, credential-bearing URLs, authorization headers, and raw provider payloads

#### Scenario: Keepa provider disabled
- **WHEN** Keepa is disabled by configuration
- **THEN** market signal refresh SHALL return a provider-unavailable result without affecting current listing acquisition providers

### Requirement: Resolve Amazon products for Keepa signals
The system SHALL refresh Keepa market signals only for deterministic Amazon product identifiers.

#### Scenario: Use product ASIN
- **WHEN** an Amazon product has an ASIN
- **THEN** the Keepa provider SHALL use that ASIN for market signal acquisition

#### Scenario: Use safe metadata ASIN
- **WHEN** an Amazon product lacks a primary ASIN but has a safe ASIN metadata field
- **THEN** the Keepa provider MAY use that metadata ASIN before failing resolution

#### Scenario: Unsupported product identifier
- **WHEN** an Amazon product cannot be mapped to a deterministic ASIN
- **THEN** the provider SHALL return failure reason `unsupported_product` without running broad title search

### Requirement: Normalize Keepa history into market signal snapshots
The system SHALL normalize Keepa history responses into bounded market signal snapshots.

#### Scenario: Successful market signal refresh
- **WHEN** Keepa returns price, sales rank, review, rating, and freshness data for a product
- **THEN** the system SHALL persist a market signal snapshot with provider `keepa`, source `third_party`, ASIN, window, confidence, timestamp, trend summaries, missing signals, and safe metadata

#### Scenario: Preserve price trend summary
- **WHEN** Keepa returns usable historical price data
- **THEN** the market signal snapshot SHALL include current provider price when available, average price, lowest price, highest price, price change percent, volatility, data point count, and time range

#### Scenario: Preserve rank and review trend summaries
- **WHEN** Keepa returns sales rank, review count, or rating history
- **THEN** the market signal snapshot SHALL include bounded rank trend, review velocity, rating movement, and data point counts where available

#### Scenario: Insufficient Keepa history
- **WHEN** Keepa returns a product with insufficient historical data for the requested window
- **THEN** the system SHALL persist or return a structured market signal result with missing signal `market_history` and root cause `insufficient_history`

### Requirement: Query and refresh market signals
The system SHALL expose product-scoped market signal refresh and query behavior.

#### Scenario: Refresh product market signals
- **WHEN** a client requests market signal refresh for a supported Amazon product
- **THEN** the system SHALL call the configured market signal provider and return success, provider, source, confidence, snapshot ID when available, and failure details when unavailable

#### Scenario: Get latest market signal snapshot
- **WHEN** a client requests latest market signals for a product
- **THEN** the system SHALL return the latest market signal snapshot or an empty/missing state if none exists

#### Scenario: Get market signal history
- **WHEN** a client requests market signal history for a product with a bounded limit
- **THEN** the system SHALL return snapshots ordered by most recent first and SHALL respect the limit

### Requirement: Track market signal provider health
The system SHALL expose Keepa market signal provider health separately from listing acquisition provider health.

#### Scenario: Healthy Keepa market signal provider
- **WHEN** recent Keepa refresh attempts mostly succeed
- **THEN** provider health SHALL report healthy status with success rate, freshness, latency, and latest attempt metadata

#### Scenario: Degraded Keepa market signal provider
- **WHEN** recent Keepa refresh attempts fail due to quota, auth, timeout, unsupported product, not found, or insufficient history
- **THEN** provider health SHALL report degraded status with bounded root causes and remediation recommendations

#### Scenario: Empty Keepa market signal history
- **WHEN** no Keepa refresh attempts exist in the requested window
- **THEN** provider health SHALL return insufficient-history status instead of failing

### Requirement: Test Keepa market signals without live network dependency
The Keepa market signal implementation SHALL be testable with fixtures and mocked HTTP responses.

#### Scenario: Fixture success test
- **WHEN** Keepa provider tests run with representative history fixtures
- **THEN** tests SHALL verify normalized price, rank, review, rating, confidence, provenance, and safe metadata

#### Scenario: Fixture failure tests
- **WHEN** provider tests run with missing credentials, auth failure, quota exhaustion, not found, unsupported product, insufficient history, timeout, and malformed response fixtures
- **THEN** tests SHALL verify failure classification and diagnostic redaction
