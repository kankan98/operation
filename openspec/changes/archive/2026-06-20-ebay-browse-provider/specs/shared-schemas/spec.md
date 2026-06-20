## ADDED Requirements

### Requirement: Extend provider metadata schemas for eBay
The shared schema package SHALL validate eBay provider metadata returned by acquisition, health, and opportunity APIs.

#### Scenario: Validate eBay provider fields
- **WHEN** a response includes provider metadata for eBay Browse acquisition
- **THEN** shared schemas SHALL accept provider `ebay-browse`, source `official_api`, confidence, attempt ID, and safe diagnostics

#### Scenario: Validate eBay diagnostic root causes
- **WHEN** eBay diagnostics include root causes such as `missing_credentials`, `auth_failed`, `rate_limited`, `quota_exhausted`, `not_found`, `marketplace_mismatch`, `price_missing`, or `unknown`
- **THEN** shared schemas SHALL validate those bounded values without allowing arbitrary high-cardinality secrets

### Requirement: Preserve cross-platform acquisition compatibility
The shared schema package SHALL preserve existing Amazon acquisition response compatibility while adding eBay provider metadata.

#### Scenario: Existing Amazon responses remain valid
- **WHEN** existing Amazon Rainforest or browser acquisition responses are validated
- **THEN** shared schemas SHALL continue to accept them without requiring eBay-specific fields

#### Scenario: eBay responses remain optional in opportunity data
- **WHEN** opportunity responses include products without eBay acquisition metadata
- **THEN** shared schemas SHALL remain compatible and SHALL NOT require eBay fields for non-eBay products
