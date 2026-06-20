## ADDED Requirements

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
