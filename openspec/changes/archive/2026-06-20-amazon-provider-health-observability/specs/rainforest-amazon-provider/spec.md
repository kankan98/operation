## ADDED Requirements

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
