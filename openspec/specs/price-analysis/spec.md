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
