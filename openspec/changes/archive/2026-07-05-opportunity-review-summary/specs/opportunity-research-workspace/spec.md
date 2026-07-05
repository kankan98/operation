## ADDED Requirements

### Requirement: Expose opportunity review summary
The opportunity research workspace SHALL expose a derived summary of active research and decision review workload without changing opportunity scoring.

#### Scenario: Summarize active research queue
- **WHEN** a client requests the opportunity review summary
- **THEN** the response SHALL include counts for total active research entries, decided entries, undecided entries, entries needing a next action, and stale decisions

#### Scenario: Summarize status and priority buckets
- **WHEN** a client requests the opportunity review summary
- **THEN** the response SHALL include counts grouped by research status and research priority

#### Scenario: Summary excludes archived entries by default
- **WHEN** archived research entries exist
- **THEN** the default opportunity review summary SHALL count only active non-archived research entries

#### Scenario: Summary remains non-scoring
- **WHEN** opportunity review summary counts change because workflow metadata changes
- **THEN** opportunity score, confidence, recommendation, recommendation gate, and factor contributions SHALL NOT change because of summary metadata

### Requirement: Surface review summary in opportunity workspace UI
The opportunity research workspace UI SHALL show a compact review summary so the user can see current operating workload before selecting filters.

#### Scenario: Display queue summary cards
- **WHEN** the opportunity workspace loads
- **THEN** the UI SHALL show summary counts for active research entries, undecided entries, decisions needing next action, and stale decisions

#### Scenario: Keep summary scoped to workflow state
- **WHEN** summary cards are displayed
- **THEN** the UI SHALL label them as review/workflow queue counts and SHALL NOT present them as sales, demand, margin, ROI, or score evidence
