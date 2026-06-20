## ADDED Requirements

### Requirement: Document eBay acquisition contracts
OpenAPI generation SHALL document eBay Browse provider acquisition and health contracts.

#### Scenario: Document eBay manual acquisition response
- **WHEN** OpenAPI documentation is generated
- **THEN** scraper product acquisition examples SHALL include an eBay success response with provider `ebay-browse`, source `official_api`, confidence, attemptId, and snapshotId

#### Scenario: Document eBay provider failure response
- **WHEN** OpenAPI documentation is generated
- **THEN** scraper product acquisition examples SHALL include an eBay provider-unavailable or not-found failure response using the standard error/acquisition response shape

#### Scenario: Document eBay provider health
- **WHEN** OpenAPI documentation is generated
- **THEN** it SHALL include eBay provider health path or platform query examples with healthy, degraded, and insufficient-history responses

### Requirement: Document eBay schema extensions
OpenAPI generation SHALL document provider/source enum extensions and eBay-safe diagnostic fields.

#### Scenario: Provider enum includes eBay
- **WHEN** OpenAPI schemas are generated
- **THEN** provider/source schema examples SHALL include `ebay-browse` and `official_api` where provider metadata is returned

#### Scenario: Diagnostics omit secrets
- **WHEN** OpenAPI examples include eBay diagnostics
- **THEN** examples SHALL show redacted safe fields and SHALL NOT include access tokens, client secrets, authorization headers, or raw provider payloads
