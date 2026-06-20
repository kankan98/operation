# eBay Browse Provider

## Purpose

The eBay Browse provider acquires product data from the official eBay Browse API using OAuth client credentials authentication. It normalizes eBay item responses into the shared acquisition result format, classifies provider failures, and preserves safe provenance metadata.

---
## Requirements
### Requirement: Authenticate eBay Browse API requests
The system SHALL authenticate eBay Browse API requests with configured OAuth client credentials and SHALL avoid exposing credentials or access tokens in logs, diagnostics, API responses, or persisted attempts.

#### Scenario: Acquire OAuth token
- **WHEN** eBay credentials are configured and an eBay product acquisition starts
- **THEN** the provider SHALL request an OAuth access token using the client-credentials flow and use it for Browse API requests

#### Scenario: Reuse unexpired token
- **WHEN** a valid cached eBay access token exists
- **THEN** the provider SHALL reuse it instead of requesting a new token for every product acquisition

#### Scenario: Missing credentials
- **WHEN** eBay credentials are not configured
- **THEN** the provider SHALL return a structured failure with provider `ebay-browse`, source `official_api`, failure reason `provider_unavailable`, and root cause `missing_credentials`

#### Scenario: Redact credential diagnostics
- **WHEN** an authentication or API failure is recorded
- **THEN** diagnostics SHALL redact client IDs, client secrets, access tokens, authorization headers, and credential-bearing URLs

### Requirement: Resolve monitored eBay items
The system SHALL resolve monitored eBay products to deterministic Browse API item lookups without guessing from broad search results.

#### Scenario: Extract legacy item ID from URL
- **WHEN** a monitored eBay product URL contains a supported item ID pattern such as `/itm/<id>`
- **THEN** the provider SHALL extract the item ID and use the Browse API item detail path for that item

#### Scenario: Use stored item ID metadata
- **WHEN** a monitored eBay product has an item ID stored in product metadata
- **THEN** the provider SHALL use that item ID before attempting URL parsing

#### Scenario: Unsupported eBay URL
- **WHEN** an eBay URL cannot be mapped to a deterministic item ID
- **THEN** the provider SHALL return a structured failure without running broad title search

### Requirement: Normalize eBay item data
The system SHALL normalize eBay Browse API item responses into the shared product acquisition result shape.

#### Scenario: Successful item acquisition
- **WHEN** the eBay Browse API returns item detail with title, price, currency, availability, image, seller, condition, and item ID
- **THEN** the acquisition result SHALL include normalized product data, provider `ebay-browse`, source `official_api`, confidence, duration, timestamp, and safe metadata

#### Scenario: Preserve eBay metadata
- **WHEN** eBay item detail includes seller username, item location, listing URL, condition, or shipping summary
- **THEN** the provider SHALL preserve safe values in metadata without requiring eBay-specific product table columns

#### Scenario: Missing price
- **WHEN** the eBay item response lacks a usable price and currency
- **THEN** the provider SHALL return failure reason `price_missing` and SHALL NOT create a misleading zero-price snapshot

### Requirement: Classify eBay provider failures
The system SHALL map eBay Browse API failures to bounded failure reasons and root causes suitable for retry, health aggregation, and operator remediation.

#### Scenario: Not found item
- **WHEN** eBay returns not found for the requested item
- **THEN** the provider SHALL return failure reason `not_found` with root cause `not_found`

#### Scenario: Rate limit or quota failure
- **WHEN** eBay returns rate-limit or quota-related errors
- **THEN** the provider SHALL return a retryable provider failure with root cause `rate_limited` or `quota_exhausted`

#### Scenario: Marketplace mismatch
- **WHEN** eBay indicates the item is not available for the configured marketplace
- **THEN** the provider SHALL return a structured failure with root cause `marketplace_mismatch`

#### Scenario: Unknown provider error
- **WHEN** eBay returns an unrecognized error
- **THEN** the provider SHALL return failure reason `unknown` with a redacted diagnostic summary

### Requirement: Test eBay provider without live network dependency
The eBay provider implementation SHALL be testable with fixtures and mocked HTTP responses rather than live eBay network calls.

#### Scenario: Fixture success test
- **WHEN** provider tests run with a representative Browse API item fixture
- **THEN** the tests SHALL verify normalized product data, provenance, confidence, and metadata mapping

#### Scenario: Fixture failure tests
- **WHEN** provider tests run with missing credentials, auth failure, rate limit, not found, marketplace mismatch, missing price, and malformed response fixtures
- **THEN** the tests SHALL verify failure classification and diagnostic redaction
