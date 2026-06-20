# Rainforest Amazon Provider

## Purpose

This capability provides an Amazon product data provider backed by Rainforest API, giving the acquisition layer a structured data source before browser fallback.

## Requirements

### Requirement: Configure Rainforest provider
The system SHALL support Rainforest API configuration for Amazon product acquisition without requiring the provider to be enabled in every environment.

#### Scenario: Use configured API key
- **WHEN** `RAINFOREST_API_KEY` is configured and `rainforest` appears in `ACQUISITION_PROVIDER_ORDER`
- **THEN** the system SHALL make the Rainforest provider available for Amazon products before browser fallback according to the configured order

#### Scenario: Missing API key
- **WHEN** `rainforest` appears in `ACQUISITION_PROVIDER_ORDER` but `RAINFOREST_API_KEY` is not configured
- **THEN** the provider SHALL return a structured failure with reason `provider_unavailable`

#### Scenario: Configure marketplace
- **WHEN** a Rainforest marketplace configuration is present
- **THEN** the provider SHALL request data for that marketplace or derive a supported marketplace from the product URL when possible

### Requirement: Acquire Amazon product data from Rainforest
The system SHALL acquire current Amazon product data through Rainforest and map successful responses into the existing scraped product data contract.

#### Scenario: Successful product response
- **WHEN** Rainforest returns a product response containing price and product details
- **THEN** the provider SHALL return success=true with price, currency, availability, title, image URL, rating, review count, and provider `rainforest`

#### Scenario: Missing optional fields
- **WHEN** Rainforest omits optional fields such as rating, review count, seller, shipping, or image URL
- **THEN** the provider SHALL still return success=true if a valid price and title can be resolved

#### Scenario: Missing price
- **WHEN** Rainforest returns a product result without a usable price
- **THEN** the provider SHALL return success=false with failure reason `price_missing`

### Requirement: Classify Rainforest provider failures
The system SHALL map Rainforest request failures and response states to the existing acquisition failure reason taxonomy.

#### Scenario: Provider rate limit or authorization error
- **WHEN** Rainforest returns an authorization, quota, or rate-limit failure
- **THEN** the provider SHALL return success=false with failure reason `provider_unavailable` and safe diagnostic metadata

#### Scenario: Product not found
- **WHEN** Rainforest indicates that the product cannot be found
- **THEN** the provider SHALL return success=false with failure reason `not_found`

#### Scenario: Network timeout
- **WHEN** the Rainforest request times out
- **THEN** the provider SHALL return success=false with failure reason `network_timeout`

#### Scenario: Unknown provider error
- **WHEN** Rainforest returns an unrecognized error shape
- **THEN** the provider SHALL return success=false with failure reason `unknown` and safe diagnostic metadata

### Requirement: Test Rainforest provider without live network calls
The system SHALL test Rainforest provider behavior using mocked HTTP responses and fixtures.

#### Scenario: Provider tests use fixtures
- **WHEN** Rainforest provider tests run
- **THEN** they SHALL use mocked responses for success, missing price, not found, invalid key, rate limit, and timeout cases

#### Scenario: No real provider calls in tests
- **WHEN** automated tests run in CI or local test mode
- **THEN** the Rainforest provider tests SHALL NOT make real network calls to Rainforest or Amazon

### Requirement: Provide normalized Rainforest diagnostics
The Rainforest provider SHALL map provider states into normalized diagnostics suitable for Amazon provider health aggregation.

#### Scenario: Missing API key diagnostic
- **WHEN** Rainforest is configured in provider order but `RAINFOREST_API_KEY` is missing
- **THEN** the provider SHALL return failure reason `provider_unavailable` with diagnostic code `missing_api_key`

#### Scenario: Authorization or quota diagnostic
- **WHEN** Rainforest returns authorization, quota, credit, rate-limit, or plan-limit errors
- **THEN** the provider SHALL return failure reason `provider_unavailable` with a normalized diagnostic code that distinguishes the provider-side availability cause when possible

#### Scenario: Marketplace diagnostic
- **WHEN** Rainforest acquisition uses a configured or URL-derived marketplace
- **THEN** diagnostics SHALL include the marketplace value used for the request without including the credential-bearing request URL

#### Scenario: Missing price diagnostic
- **WHEN** Rainforest returns a product response without a usable price
- **THEN** the provider SHALL return failure reason `price_missing` with diagnostic code `price_missing`

### Requirement: Bound Rainforest provider error details
The Rainforest provider SHALL sanitize and bound provider error details before persisting diagnostics.

#### Scenario: Provider message is sanitized
- **WHEN** Rainforest returns a provider message
- **THEN** diagnostics SHALL include a sanitized message that omits API keys, request URLs containing query strings, and raw payload fragments

#### Scenario: Provider errors are summarized
- **WHEN** Rainforest returns nested `errors` data
- **THEN** diagnostics SHALL include only a bounded summary needed for troubleshooting and tests

#### Scenario: Diagnostics can be disabled
- **WHEN** Rainforest diagnostic capture is disabled by configuration
- **THEN** the provider SHALL still return the correct failure reason while omitting optional diagnostic metadata

### Requirement: Cover Rainforest observability with fixtures
The system SHALL test Rainforest observability behavior using mocked responses and fixtures.

#### Scenario: Diagnostic fixture coverage
- **WHEN** Rainforest provider tests run
- **THEN** fixtures SHALL cover missing API key, invalid key, quota/rate limit, timeout, not found, missing price, marketplace resolution, and unknown provider error

#### Scenario: No secret leakage in fixtures
- **WHEN** fixture-based diagnostics tests inspect stored diagnostics
- **THEN** they SHALL verify that API keys and credential-bearing URLs are absent
