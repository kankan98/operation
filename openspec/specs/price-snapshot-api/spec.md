## Purpose

Price snapshot API records and retrieves product price observations used for historical tracking, charts, alerts, and analysis.
## Requirements
### Requirement: Create price snapshot
The system SHALL allow creating a new price snapshot for a product.

#### Scenario: Create snapshot with required fields
- **WHEN** POST request to /api/price-snapshots with productId, price, currency, and availability
- **THEN** system SHALL create the snapshot with generated id and timestamp, and return 201 status

#### Scenario: Create snapshot with optional fields
- **WHEN** POST request includes optional fields (rating, reviewCount, salesRank, shippingCost, seller, condition, metadata)
- **THEN** system SHALL store all provided fields in the snapshot

#### Scenario: Reject missing required fields
- **WHEN** POST request missing productId, price, currency, or availability
- **THEN** system SHALL return 400 status with error code VALIDATION_ERROR

### Requirement: Query product snapshots
The system SHALL allow retrieving all price snapshots for a product.

#### Scenario: Get all snapshots for a product
- **WHEN** GET request to /api/price-snapshots/product/:productId
- **THEN** system SHALL return 200 status with array of snapshots ordered by timestamp descending

#### Scenario: Limit snapshot results
- **WHEN** GET request to /api/price-snapshots/product/:productId?limit=10
- **THEN** system SHALL return at most 10 most recent snapshots

#### Scenario: Empty results for product with no snapshots
- **WHEN** GET request for a product that has no snapshots
- **THEN** system SHALL return 200 status with empty array

### Requirement: Get latest snapshot
The system SHALL allow retrieving the most recent price snapshot for a product.

#### Scenario: Get latest snapshot
- **WHEN** GET request to /api/price-snapshots/product/:productId/latest
- **THEN** system SHALL return 200 status with the most recent snapshot by timestamp

#### Scenario: No snapshots exist
- **WHEN** GET request for a product that has no snapshots
- **THEN** system SHALL return 404 status with error code NOT_FOUND

### Requirement: Latest reading updates canonical product price and freshness
When a price snapshot is recorded and it is the newest reading for the product, the system SHALL update the product's canonical `currentPrice` and `lastCheckedAt` so downstream surfaces (product list, opportunity workspace) reflect the freshest data and do not display a stale marker for just-entered values.

#### Scenario: Manual reading is the newest reading
- **WHEN** a manual price snapshot is recorded whose timestamp is greater than or equal to the product's latest existing snapshot timestamp
- **THEN** the product's `currentPrice` SHALL be set to the snapshot price and `lastCheckedAt` SHALL be set to the snapshot timestamp

#### Scenario: Back-dated historical reading does not overwrite current price
- **WHEN** a snapshot is recorded with an explicit recorded-at date older than the product's latest existing snapshot
- **THEN** the product's `currentPrice` and `lastCheckedAt` SHALL remain unchanged, because the back-dated reading is not the newest observation

#### Scenario: Stale marker clears after fresh manual entry
- **WHEN** a product previously marked stale (last checked over 24h ago) receives a new manual reading
- **THEN** `lastCheckedAt` SHALL advance to the new reading time so the stale marker no longer applies
