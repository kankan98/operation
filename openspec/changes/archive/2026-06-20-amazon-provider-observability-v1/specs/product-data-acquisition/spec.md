## ADDED Requirements

### Requirement: Prefer Rainforest provider before Amazon browser fallback
The system SHALL prefer a configured Rainforest provider before Amazon browser fallback when acquiring Amazon product data.

#### Scenario: Rainforest configured before browser fallback
- **WHEN** an Amazon product is acquired and provider order is `rainforest,amazon-browser`
- **THEN** the system SHALL attempt `rainforest` before `amazon-browser`

#### Scenario: Rainforest unavailable falls back to browser
- **WHEN** Rainforest is ordered first but unavailable because credentials are missing or invalid
- **THEN** the system SHALL record the Rainforest failure and continue to `amazon-browser` when browser fallback is enabled

#### Scenario: Rainforest success stops provider chain
- **WHEN** Rainforest returns a successful acquisition result
- **THEN** the system SHALL NOT call `amazon-browser` for the same acquisition job

### Requirement: Preserve Rainforest acquisition provenance
The system SHALL preserve Rainforest provenance on successful acquisition results and price snapshots.

#### Scenario: Result includes Rainforest provenance
- **WHEN** Rainforest acquisition succeeds
- **THEN** the acquisition result SHALL include provider `rainforest`, source `third_party`, confidence, duration, timestamp, job ID, and attempt ID when available

#### Scenario: Snapshot metadata includes Rainforest provenance
- **WHEN** a price snapshot is created from Rainforest data
- **THEN** the snapshot metadata SHALL include provider `rainforest`, source `third_party`, confidence, attempt ID, and freshness information

#### Scenario: Attempt history records Rainforest failure
- **WHEN** Rainforest acquisition fails
- **THEN** scrape attempt history SHALL include provider `rainforest`, source `third_party`, status, failure reason, duration, and safe diagnostics
