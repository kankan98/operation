## ADDED Requirements

### Requirement: Document opportunity research workspace APIs
OpenAPI generation SHALL document opportunity research entry, comparison, and export API contracts.

#### Scenario: Document research entry CRUD
- **WHEN** OpenAPI documentation is generated
- **THEN** it SHALL include endpoints for creating, reading, updating, archiving, and deleting product research entries with request and response schemas

#### Scenario: Document comparison endpoint
- **WHEN** OpenAPI documentation is generated
- **THEN** it SHALL include the comparison endpoint with product ID limits, response rows, and missing product validation examples

#### Scenario: Document export endpoint
- **WHEN** OpenAPI documentation is generated
- **THEN** it SHALL include CSV and JSON export request/response examples and documented export size limits

### Requirement: Document research caveats and non-scoring semantics
OpenAPI generation SHALL make research metadata semantics clear in API examples.

#### Scenario: Research metadata does not affect score
- **WHEN** OpenAPI examples include opportunity responses with research metadata
- **THEN** the examples SHALL document that status, tags, notes, and priority do not change opportunity score or factor contributions

#### Scenario: Export examples include caveats
- **WHEN** OpenAPI examples include exported opportunity rows
- **THEN** the examples SHALL include caveat fields for market proxy signals and merchant-entered business assumptions
