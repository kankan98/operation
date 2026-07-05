## ADDED Requirements

### Requirement: Shared response schemas match backend response nullability
The shared schema package SHALL accept nullable response fields that are returned as null by backend services and database-backed entities.

#### Scenario: Product nullable fields validate
- **WHEN** a backend product response includes null brand, category, image URL, user ID, updated time, last checked time, or metadata fields
- **THEN** the shared product response schema SHALL validate the response

### Requirement: Opportunity response schemas preserve compatibility
The shared schema package SHALL preserve compatibility with existing opportunity responses while accepting newer recommendation gate data.

#### Scenario: Existing opportunity responses remain valid
- **WHEN** an opportunity response contains score, confidence, recommendation, reasons, missing signals, factors, acquisition health, and business signals without recommendation gate or market signals
- **THEN** the shared opportunity schema SHALL validate it

#### Scenario: New opportunity responses include recommendation gate
- **WHEN** an opportunity response includes recommendation gate context
- **THEN** the shared opportunity schema SHALL validate the gate status, applied flag, original recommendation, final recommendation, reasons, signals, and next actions
