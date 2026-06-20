## ADDED Requirements

### Requirement: Document market signal APIs
OpenAPI generation SHALL document product market signal refresh, latest snapshot, history, and provider health contracts.

#### Scenario: Document market signal refresh
- **WHEN** OpenAPI documentation is generated
- **THEN** it SHALL include the market signal refresh endpoint with success, provider-unavailable, unsupported-product, and quota-exhausted examples

#### Scenario: Document latest market signal snapshot
- **WHEN** OpenAPI documentation is generated
- **THEN** it SHALL include the latest market signal response schema with provider, source, confidence, freshness, price trend, rank trend, review velocity, rating movement, missing signals, and safe metadata

#### Scenario: Document market signal history
- **WHEN** OpenAPI documentation is generated
- **THEN** it SHALL include market signal history query parameters, bounded pagination or limit behavior, and example snapshot arrays

#### Scenario: Document Keepa provider health
- **WHEN** OpenAPI documentation is generated
- **THEN** it SHALL include Keepa market signal provider health examples for healthy, degraded, and insufficient-history states

### Requirement: Document market signal schema safety
OpenAPI generation SHALL document bounded diagnostics and caveats for market signal data.

#### Scenario: Provider enum includes Keepa
- **WHEN** OpenAPI schemas are generated
- **THEN** provider/source schema examples SHALL include provider `keepa` and source `third_party` where market signal metadata is returned

#### Scenario: Diagnostics omit Keepa secrets
- **WHEN** OpenAPI examples include Keepa diagnostics
- **THEN** examples SHALL show only redacted or safe diagnostic fields and SHALL NOT include API keys, credential-bearing URLs, authorization headers, or raw provider payloads

#### Scenario: Market signals caveat documented
- **WHEN** OpenAPI examples include opportunity responses with market signals
- **THEN** examples SHALL distinguish trend/proxy evidence from verified sales, demand, margin, ROI, or profitability facts
