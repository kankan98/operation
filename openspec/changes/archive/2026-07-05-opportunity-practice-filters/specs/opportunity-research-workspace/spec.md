## ADDED Requirements

### Requirement: Filter opportunities by practice outcome metadata
The opportunity research workspace SHALL let clients filter opportunity and research lists by latest daily action outcome coverage without changing opportunity scoring.

#### Scenario: Filter entries with recorded action outcomes
- **WHEN** a client requests opportunity or research lists with the practice outcome filter set to recorded outcomes
- **THEN** the response SHALL include only non-archived researched entries that have a latest action outcome

#### Scenario: Filter entries missing action outcomes
- **WHEN** a client requests opportunity or research lists with the practice outcome filter set to missing outcomes
- **THEN** the response SHALL include only non-archived researched entries that do not have a latest action outcome

#### Scenario: Filter entries by latest action id
- **WHEN** a client requests opportunity or research lists with a known daily action id filter
- **THEN** the response SHALL include only entries whose latest action outcome uses that action id

#### Scenario: Practice filters remain non-scoring
- **WHEN** practice outcome filters are applied or latest action outcomes are saved or cleared
- **THEN** opportunity score, confidence, recommendation, recommendation gate, market signals, business metrics, and factor contributions SHALL NOT change because of practice filter metadata

### Requirement: Apply practice filters from opportunity workspace UI
The opportunity research workspace UI SHALL let the user navigate from practice coverage summary controls to the filtered candidate list.

#### Scenario: Apply missing outcome filter
- **WHEN** the user selects the missing-outcome control from the practice summary area
- **THEN** the workspace SHALL show researched candidates without latest action outcomes using the existing opportunity list surface

#### Scenario: Apply action bucket filter
- **WHEN** the user selects a known daily action bucket from the practice summary area
- **THEN** the workspace SHALL show researched candidates whose latest action outcome uses that action id

#### Scenario: Keep practice filter labels scoped to workflow evidence
- **WHEN** practice filters are displayed or applied
- **THEN** the UI SHALL label them as workflow practice evidence filters and SHALL NOT present them as sales, demand, margin, ROI, score, market evidence, or a training grade
