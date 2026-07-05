## ADDED Requirements

### Requirement: Record daily action outcome
The opportunity research workspace SHALL let clients record the latest completed daily action outcome for a product-scoped research entry.

#### Scenario: Save action outcome
- **WHEN** a client records an action outcome for an existing researched product
- **THEN** the system SHALL persist the daily action id, bounded outcome text, completion timestamp, and update timestamp on that research entry

#### Scenario: Validate action outcome
- **WHEN** a client records an action outcome with an unsupported action id or oversized outcome text
- **THEN** the system SHALL reject the request with validation feedback instead of storing partial outcome metadata

#### Scenario: Clear action outcome
- **WHEN** a client clears the action outcome for a researched product
- **THEN** the system SHALL remove the latest action outcome fields while preserving research status, priority, tags, notes, archived flag, decisions, and product score inputs

#### Scenario: Require existing product for outcome writes
- **WHEN** a client records or clears an action outcome for a missing product ID
- **THEN** the system SHALL return a product-not-found error

### Requirement: Expose daily action outcomes in research read models
The opportunity research workspace SHALL expose latest daily action outcome metadata wherever research metadata is returned.

#### Scenario: Read research entry outcome
- **WHEN** a client reads a product's opportunity research metadata
- **THEN** the response SHALL include the latest action outcome when present and `null` when no outcome has been recorded

#### Scenario: Include outcome in opportunity lists and comparisons
- **WHEN** a product opportunity list or comparison response includes research metadata
- **THEN** the research metadata SHALL include latest action outcome metadata without recomputing outcome state in the frontend

#### Scenario: Export outcome fields
- **WHEN** a client exports researched opportunities as CSV or JSON
- **THEN** each export row SHALL include latest action id, latest action outcome, and latest action completion timestamp fields

#### Scenario: Outcome metadata remains non-scoring
- **WHEN** action outcome metadata is saved, cleared, or exported
- **THEN** opportunity score, confidence, recommendation, recommendation gate, market signals, business metrics, and factor contributions SHALL NOT change because of outcome metadata

### Requirement: Surface daily action outcomes in opportunity workspace UI
The opportunity research workspace UI SHALL let the user record and inspect latest action outcomes from the review flow.

#### Scenario: Show latest outcome on selected opportunity
- **WHEN** the selected opportunity has a latest action outcome
- **THEN** the detail panel SHALL show the action label, outcome text, and completion timestamp as workflow practice evidence

#### Scenario: Record outcome from selected opportunity
- **WHEN** the user records a daily action outcome from the selected opportunity
- **THEN** the frontend SHALL call the action outcome write API and refresh opportunity list, selected explanation, comparison, and research metadata queries

#### Scenario: Clear outcome from selected opportunity
- **WHEN** the user clears the latest action outcome
- **THEN** the frontend SHALL call the clear API and refresh the same opportunity context

#### Scenario: Keep outcomes scoped to workflow practice
- **WHEN** action outcome metadata is displayed
- **THEN** the UI SHALL label it as workflow or review practice evidence and SHALL NOT present it as sales, demand, margin, ROI, score, or market evidence
