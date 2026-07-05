## ADDED Requirements

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
