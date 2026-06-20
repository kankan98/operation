## ADDED Requirements

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
