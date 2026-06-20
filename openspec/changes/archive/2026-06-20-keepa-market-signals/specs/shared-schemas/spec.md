## ADDED Requirements

### Requirement: Define market signal schemas
The shared schema package SHALL define reusable market signal schemas for backend, frontend, and OpenAPI generation.

#### Scenario: Validate market signal snapshot
- **WHEN** a response includes a market signal snapshot
- **THEN** shared schemas SHALL validate provider, source, product ID, platform, ASIN, window, confidence, freshness, trend summaries, missing signals, metadata, and timestamps

#### Scenario: Validate market signal refresh result
- **WHEN** a market signal refresh succeeds or fails
- **THEN** shared schemas SHALL validate success, provider, source, snapshot ID when available, failure reason, root cause, diagnostics, confidence, duration, and timestamp

#### Scenario: Validate market signal provider health
- **WHEN** a market signal provider health response is returned
- **THEN** shared schemas SHALL validate health status, provider summaries, failure distribution, root causes, latest attempts, and recommendations

### Requirement: Extend opportunity schemas with market signals
The shared schema package SHALL support opportunity responses that include market signal factors and caveats.

#### Scenario: Opportunity includes market signal factors
- **WHEN** opportunity responses include market trend factors
- **THEN** shared schemas SHALL accept factor names, raw values, normalized contribution, confidence impact, source, freshness, and explanation text

#### Scenario: Market signal fields remain optional
- **WHEN** opportunity responses do not include market signal data
- **THEN** shared schemas SHALL remain compatible and SHALL NOT require market signal fields for products without refreshed market signals

### Requirement: Preserve bounded market diagnostic values
The shared schema package SHALL restrict market signal diagnostics to bounded values that do not leak secrets.

#### Scenario: Validate bounded root causes
- **WHEN** Keepa diagnostics include root causes such as `missing_credentials`, `auth_failed`, `quota_exhausted`, `rate_limited`, `not_found`, `unsupported_product`, `insufficient_history`, `network_timeout`, or `unknown`
- **THEN** shared schemas SHALL validate those bounded values without accepting arbitrary high-cardinality secret fields

#### Scenario: Reject unsafe diagnostic payloads
- **WHEN** market signal diagnostics include raw API keys, authorization headers, or raw provider payload fields
- **THEN** shared schema tests SHALL fail unless the values are redacted or omitted
