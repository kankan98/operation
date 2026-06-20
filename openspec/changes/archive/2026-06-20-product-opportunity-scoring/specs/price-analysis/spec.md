## ADDED Requirements

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
