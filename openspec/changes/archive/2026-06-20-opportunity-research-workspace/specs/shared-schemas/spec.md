## ADDED Requirements

### Requirement: Define opportunity research schemas
The shared schema package SHALL define reusable schemas and types for opportunity research workspace entities.

#### Scenario: Validate research entry
- **WHEN** a response includes an opportunity research entry
- **THEN** shared schemas SHALL validate product ID, status, priority, tags, notes, archived flag, created timestamp, and updated timestamp

#### Scenario: Validate research update payload
- **WHEN** a client updates research status, tags, priority, notes, or archived state
- **THEN** shared schemas SHALL validate supported enum values, bounded tag count, bounded tag length, and bounded notes length

#### Scenario: Validate optional research metadata on opportunities
- **WHEN** opportunity responses include research metadata
- **THEN** shared schemas SHALL accept the metadata without requiring it for products that are not shortlisted

### Requirement: Define opportunity comparison schemas
The shared schema package SHALL define schemas for comparing researched opportunities.

#### Scenario: Validate comparison request
- **WHEN** a comparison request includes product IDs
- **THEN** shared schemas SHALL validate a bounded non-empty product ID list

#### Scenario: Validate comparison response
- **WHEN** a comparison response is returned
- **THEN** shared schemas SHALL validate product summary, score, confidence, recommendation, research metadata, acquisition health, market signals, business signals, missing signals, and caveats

### Requirement: Define opportunity export schemas
The shared schema package SHALL define schemas for opportunity research export requests and rows.

#### Scenario: Validate export request
- **WHEN** a client requests opportunity research export
- **THEN** shared schemas SHALL validate format, selected product IDs or filters, and bounded export limits

#### Scenario: Validate export row
- **WHEN** export rows are returned as JSON or produced for CSV
- **THEN** shared schemas SHALL validate product identity, platform, price, score, confidence, recommendation, research state, tags, top reasons, missing signals, and caveat fields
