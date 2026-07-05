## ADDED Requirements

### Requirement: Display price source and freshness on decision-driving numbers
The product detail UI SHALL surface the source and freshness of price numbers so the user can judge how much to trust them when deciding. Numbers SHALL never appear as authoritative without an indication of where they came from and whether they may be outdated.

#### Scenario: Current price shows its source
- **WHEN** the product detail page renders the current price KPI and price statistics include provenance
- **THEN** the UI SHALL display the source label (e.g. 手动录入) alongside the current price

#### Scenario: Stale current price is visibly flagged
- **WHEN** the current price provenance is stale
- **THEN** the UI SHALL display a "可能已过时，建议复核" style indicator rather than presenting the value as freshly verified

#### Scenario: Price history rows reflect per-row source and age
- **WHEN** the price history table renders snapshot rows
- **THEN** each row SHALL display that row's source and its recorded date/time, so a reading's origin and age are visible per row (freshness/stale emphasis for the decision-driving current price is delivered via the backend-derived provenance on the current-price KPI, keeping freshness thresholds a single backend source of truth)

#### Scenario: Cache invalidation refreshes list surfaces after manual entry
- **WHEN** a manual reading is saved from the product detail page
- **THEN** the product list cache SHALL be invalidated so the product card price and stale marker update without a manual refresh
