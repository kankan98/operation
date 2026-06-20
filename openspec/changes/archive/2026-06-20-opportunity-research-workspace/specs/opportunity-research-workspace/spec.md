## ADDED Requirements

### Requirement: Persist opportunity research entries
The system SHALL persist product-scoped opportunity research entries independently from opportunity score calculations.

#### Scenario: Create shortlist entry
- **WHEN** a client adds a product to the opportunity research workspace
- **THEN** the system SHALL create or update a research entry with product ID, status, priority, tags, notes, archived flag, created timestamp, and updated timestamp

#### Scenario: Keep one active entry per product
- **WHEN** a client adds the same product to the workspace more than once
- **THEN** the system SHALL update the existing entry instead of creating duplicate active entries for the product

#### Scenario: Delete product cleanup
- **WHEN** a product is deleted
- **THEN** the system SHALL delete or detach its opportunity research entry so orphaned workspace rows are not returned

### Requirement: Manage research status, tags, and notes
The system SHALL let clients update research workflow metadata for shortlisted opportunities.

#### Scenario: Update research status
- **WHEN** a client updates a research entry status
- **THEN** the system SHALL persist one of the supported statuses and update the modified timestamp

#### Scenario: Normalize tags
- **WHEN** a client saves tags with repeated values, whitespace, or mixed case
- **THEN** the system SHALL return a bounded normalized tag list without duplicates

#### Scenario: Save notes
- **WHEN** a client saves notes for a research entry
- **THEN** the system SHALL persist bounded notes text without changing the product score

### Requirement: Compare researched opportunities
The system SHALL provide a bounded comparison read model for selected product opportunities.

#### Scenario: Compare selected products
- **WHEN** a client requests comparison for selected product IDs
- **THEN** the system SHALL return opportunity score, confidence, recommendation, price, acquisition health, market signals, business signals, research metadata, and missing signals for each selected product

#### Scenario: Enforce comparison limit
- **WHEN** a comparison request includes more than the configured maximum number of products
- **THEN** the system SHALL reject the request with validation feedback instead of generating an oversized comparison

#### Scenario: Preserve score determinism
- **WHEN** comparison results include research metadata
- **THEN** the system SHALL NOT change opportunity score or factor contributions because of shortlist status, notes, tags, or priority

### Requirement: Export researched opportunities
The system SHALL export selected or filtered opportunities in machine-readable formats.

#### Scenario: Export selected opportunities as CSV
- **WHEN** a client requests CSV export for selected researched products
- **THEN** the system SHALL return rows containing product identity, platform, price, score, confidence, recommendation, research status, priority, tags, top reasons, missing signals, and caveats

#### Scenario: Export selected opportunities as JSON
- **WHEN** a client requests JSON export for selected researched products
- **THEN** the system SHALL return structured export rows with the same fields as CSV export

#### Scenario: Include caveats in export
- **WHEN** export rows include market signals or business metrics
- **THEN** each row SHALL include caveats that proxy trends and merchant assumptions are not verified sales, demand, margin, ROI, or profitability facts

### Requirement: Keep research workspace observable and bounded
The system SHALL keep research workspace operations safe, bounded, and testable.

#### Scenario: Validate unsupported product
- **WHEN** a client creates research metadata for a missing product ID
- **THEN** the system SHALL return a product-not-found error

#### Scenario: Bound export size
- **WHEN** a client requests export using filters that match more than the maximum export limit
- **THEN** the system SHALL cap or reject the export according to the documented limit

#### Scenario: Test without external network
- **WHEN** research workspace tests run
- **THEN** they SHALL use local fixtures and database state without requiring live marketplace or provider network calls
