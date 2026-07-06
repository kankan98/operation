## MODIFIED Requirements

### Requirement: Calculate price statistics
The system SHALL calculate price statistics from historical snapshots for a given product and SHALL distinguish an existing product with no snapshots from an invalid product identifier.

#### Scenario: Calculate statistics with multiple snapshots
- **WHEN** requesting price statistics for a product with 10+ snapshots
- **THEN** system SHALL return current price, highest price, lowest price, average price, price change amount, price change percentage, data point count, and timestamp range

#### Scenario: Calculate statistics with single snapshot
- **WHEN** requesting price statistics for a product with only 1 snapshot
- **THEN** system SHALL return current price as all statistics (highest=lowest=average=current), zero change, and single data point

#### Scenario: Handle existing product with no snapshots
- **WHEN** requesting HTTP price statistics for an existing product with no snapshots
- **THEN** system SHALL return a non-error empty statistics response with zero data points and unknown price provenance
- **AND** consumers SHALL be able to detect that no price reading exists from the zero data point count

#### Scenario: Preserve missing-price semantics for internal analysis callers
- **WHEN** internal alerting or agent analysis code asks the price analysis service for a product with no snapshots
- **THEN** the service SHALL continue to report insufficient price data instead of returning a usable current price
