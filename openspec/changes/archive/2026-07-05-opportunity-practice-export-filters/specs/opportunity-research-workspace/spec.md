## ADDED Requirements

### Requirement: Export opportunities with practice filters
The opportunity research workspace SHALL let filtered exports preserve latest daily action outcome filter context without changing opportunity scoring.

#### Scenario: Export entries with recorded action outcomes
- **WHEN** a client requests an opportunity research export using `filters.actionOutcome=with`
- **THEN** the export SHALL include only non-archived researched entries that have a latest action outcome

#### Scenario: Export entries missing action outcomes
- **WHEN** a client requests an opportunity research export using `filters.actionOutcome=without`
- **THEN** the export SHALL include only non-archived researched entries that do not have a latest action outcome

#### Scenario: Export entries by latest action id
- **WHEN** a client requests an opportunity research export using `filters.actionId` set to a known daily action id
- **THEN** the export SHALL include only entries whose latest action outcome uses that action id

#### Scenario: Export current practice view from workspace
- **WHEN** the opportunity workspace has an active practice filter and the user exports by filters rather than selected product IDs
- **THEN** the frontend SHALL include the active practice filter fields in the export request

#### Scenario: Practice export filters remain non-scoring
- **WHEN** practice outcome filters are used for export
- **THEN** opportunity score, confidence, recommendation, recommendation gate, market signals, business metrics, and factor contributions SHALL NOT change because of the export filter metadata
