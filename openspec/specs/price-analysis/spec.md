# Price Analysis Specification

## Purpose

This capability provides price statistics and trend analysis for monitored products based on historical snapshot data.

---
## Requirements
### Requirement: Calculate price statistics
The system SHALL calculate price statistics from historical snapshots for a given product.

#### Scenario: Calculate statistics with multiple snapshots
- **WHEN** requesting price statistics for a product with 10+ snapshots
- **THEN** system SHALL return current price, highest price, lowest price, average price, price change amount, price change percentage, data point count, and timestamp range

#### Scenario: Calculate statistics with single snapshot
- **WHEN** requesting price statistics for a product with only 1 snapshot
- **THEN** system SHALL return current price as all statistics (highest=lowest=average=current), zero change, and single data point

#### Scenario: Handle product with no snapshots
- **WHEN** requesting price statistics for a product with no snapshots
- **THEN** system SHALL return error "No price data available"

### Requirement: Detect price trends
The system SHALL analyze price trends from snapshot history.

#### Scenario: Detect rising trend
- **WHEN** last 3 snapshots show consecutive price increases
- **THEN** system SHALL identify trend as "rising"

#### Scenario: Detect falling trend
- **WHEN** last 3 snapshots show consecutive price decreases
- **THEN** system SHALL identify trend as "falling"

#### Scenario: Detect stable trend
- **WHEN** last 3 snapshots show price changes within 2% threshold
- **THEN** system SHALL identify trend as "stable"

### Requirement: Calculate price change percentage
The system SHALL calculate accurate price change percentages between snapshots.

#### Scenario: Calculate percentage from first to current
- **WHEN** first snapshot price was 100 and current price is 90
- **THEN** system SHALL return price change as -10 and percentage as -10.0%

#### Scenario: Calculate percentage with price increase
- **WHEN** first snapshot price was 100 and current price is 120
- **THEN** system SHALL return price change as 20 and percentage as 20.0%

#### Scenario: Handle division by zero
- **WHEN** first snapshot price was 0
- **THEN** system SHALL return percentage as 0.0%

### Requirement: Provide reusable opportunity price signals
The price analysis layer SHALL provide reusable price signals for product opportunity scoring.

#### Scenario: Build price signals from history
- **WHEN** a product has historical price snapshots
- **THEN** the price analysis layer SHALL provide current price, average price, lowest price, highest price, price change percent, volatility signal, and data point count for scoring

#### Scenario: Handle single snapshot signal
- **WHEN** a product has only one price snapshot
- **THEN** the price analysis layer SHALL return usable current price data and SHALL mark trend and volatility signals as low confidence

#### Scenario: Handle no snapshot signal
- **WHEN** a product has no price snapshots
- **THEN** the price analysis layer SHALL return a missing price history signal instead of causing opportunity list scoring to fail

### Requirement: Support cross-product signal collection
The price analysis layer SHALL support collecting bounded price signals across multiple products for opportunity ranking.

#### Scenario: Collect signals for product page
- **WHEN** opportunity scoring requests signals for a page of products
- **THEN** the price analysis layer SHALL return signals for each product without requiring one route call per product from the frontend

#### Scenario: Bound history window
- **WHEN** collecting cross-product signals
- **THEN** the price analysis layer SHALL use a bounded history window so ranking remains predictable for large catalogs

### Requirement: Price statistics carry source provenance
The price statistics response SHALL include provenance for the current price, derived from the latest snapshot's source and timestamp, so that no price number is presented without its origin and freshness. Provenance SHALL be computed on the backend (single source of truth) and SHALL include source, age, stale flag, trust level, and a human-readable label.

#### Scenario: Fresh manual reading provenance
- **WHEN** `getPriceStats` is called for a product whose latest snapshot is a recent `manual` reading within the freshness window
- **THEN** the response SHALL include a `provenance` object with `source: 'manual'`, `stale: false`, and `trust: 'high'`

#### Scenario: Stale reading is not presented as verified
- **WHEN** the latest snapshot is older than its source freshness threshold (e.g. a manual reading older than 7 days)
- **THEN** the `provenance` SHALL report `stale: true`, a downgraded `trust`, and a `label` indicating the value may be outdated and should be re-checked

#### Scenario: Provenance reflects the actual source of the latest reading
- **WHEN** the latest snapshot source is a low-trust origin such as `cache` or `unknown`
- **THEN** the `provenance.source` SHALL reflect that origin and `trust` SHALL be no higher than the source's defined ceiling
