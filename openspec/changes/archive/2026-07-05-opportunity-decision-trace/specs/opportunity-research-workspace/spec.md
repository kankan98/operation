## ADDED Requirements

### Requirement: Record opportunity decision trace
The opportunity research workspace SHALL persist one current product-scoped decision trace for a researched opportunity without changing opportunity score calculations.

#### Scenario: Save go decision with evidence snapshot
- **WHEN** a client records a `go` decision for a researched product
- **THEN** the system SHALL persist the decision, bounded reason, bounded next action, decided timestamp, and a backend-generated evidence snapshot containing score, confidence, recommendation, recommendation gate, key reasons, missing signals, business summary, and market summary

#### Scenario: Save hold or no-go decision
- **WHEN** a client records a `hold` or `no_go` decision for a researched product
- **THEN** the system SHALL replace the current decision trace for that product and update the decision timestamp

#### Scenario: Clear current decision
- **WHEN** a client clears the current decision for a researched product
- **THEN** the system SHALL remove the current decision fields while preserving research status, priority, tags, notes, archived flag, and product score inputs

#### Scenario: Decision does not affect score
- **WHEN** a client saves, updates, or clears a decision trace
- **THEN** the product's opportunity score, confidence, factor contributions, recommendation, and recommendation gate SHALL remain determined only by scoring inputs

### Requirement: Expose decision trace in research read models
The opportunity research workspace SHALL expose the current decision trace wherever research metadata is returned.

#### Scenario: Read researched opportunity decision
- **WHEN** a client reads a product's opportunity research metadata
- **THEN** the response SHALL include the current decision trace when present and `null` when no decision has been recorded

#### Scenario: List and explain opportunities with decision
- **WHEN** a product opportunity list or explanation response includes research metadata
- **THEN** the research metadata SHALL include the current decision trace without recomputing decision state in the frontend

#### Scenario: Compare opportunities with decision
- **WHEN** a client compares selected researched opportunities
- **THEN** each compared opportunity SHALL include the current decision trace in its research metadata when present

#### Scenario: Export opportunities with decision fields
- **WHEN** a client exports researched opportunities as CSV or JSON
- **THEN** each export row SHALL include decision status, reason, next action, decided timestamp, and decision snapshot score and recommendation fields

### Requirement: Validate decision trace inputs
The opportunity research workspace SHALL validate decision trace writes so stored decisions stay bounded and product-scoped.

#### Scenario: Reject unsupported decision status
- **WHEN** a client records a decision status other than `go`, `hold`, or `no_go`
- **THEN** the system SHALL reject the request with validation feedback

#### Scenario: Bound decision text
- **WHEN** a client records a decision reason or next action that exceeds the configured text limit
- **THEN** the system SHALL reject the request with validation feedback instead of truncating silently

#### Scenario: Require existing product
- **WHEN** a client records or clears a decision for a missing product ID
- **THEN** the system SHALL return a product-not-found error

### Requirement: Manage decision from selected opportunity detail
The opportunity research workspace UI SHALL let the user save and clear the current decision from the selected candidate detail without presenting the decision as an automated recommendation.

#### Scenario: Display selected opportunity decision state
- **WHEN** the selected opportunity has a current decision trace
- **THEN** the detail panel SHALL show the decision status, reason, next action, decided timestamp, and captured score or recommendation snapshot

#### Scenario: Save decision from selected opportunity
- **WHEN** the user chooses `go`, `hold`, or `no-go` and enters decision notes from the selected opportunity
- **THEN** the frontend SHALL call the decision write API for that product and refresh opportunity list, selected explanation, and research metadata queries

#### Scenario: Clear decision from selected opportunity
- **WHEN** the user clears the current selected opportunity decision
- **THEN** the frontend SHALL call the clear decision API and refresh the same opportunity context
