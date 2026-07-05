## ADDED Requirements

### Requirement: Expose opportunity practice summary
The opportunity research workspace SHALL expose a derived practice summary for active research entries without changing opportunity scoring.

#### Scenario: Summarize action outcome coverage
- **WHEN** a client requests the opportunity practice summary
- **THEN** the response SHALL include total active research entries, entries with a latest action outcome, entries without a latest action outcome, counts by daily action id, latest completion timestamp, generated timestamp, and a non-scoring caveat

#### Scenario: Practice summary excludes archived entries
- **WHEN** archived research entries exist
- **THEN** the practice summary SHALL count only active non-archived research entries

#### Scenario: Practice summary uses stable action buckets
- **WHEN** no entries have outcomes for one or more known daily action ids
- **THEN** the response SHALL still include zero counts for those action ids

#### Scenario: Practice summary remains non-scoring
- **WHEN** latest action outcomes are saved, cleared, or summarized
- **THEN** opportunity score, confidence, recommendation, recommendation gate, market signals, business metrics, and factor contributions SHALL NOT change because of practice summary metadata

### Requirement: Surface practice summary in opportunity workspace UI
The opportunity research workspace UI SHALL show compact practice coverage so the user can see whether action guidance is turning into recorded execution.

#### Scenario: Display practice coverage cards
- **WHEN** the opportunity workspace loads
- **THEN** the UI SHALL show active count, with-outcome count, without-outcome count, and latest completion timestamp near the review summary and daily action plan

#### Scenario: Display action bucket counts
- **WHEN** the practice summary includes counts by action id
- **THEN** the UI SHALL show the known daily action labels with their recorded outcome counts

#### Scenario: Keep practice summary scoped to workflow evidence
- **WHEN** practice summary metadata is displayed
- **THEN** the UI SHALL label it as workflow or practice coverage and SHALL NOT present it as sales, demand, margin, ROI, score, market evidence, or a training grade
