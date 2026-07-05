## ADDED Requirements

### Requirement: Carry selected action context into outcome recording
The opportunity research workspace UI SHALL preserve the selected workflow action context long enough to help the user record the matching latest action outcome.

#### Scenario: Prefill outcome action from daily action
- **WHEN** the user selects a daily action item and opens a candidate without an existing latest action outcome
- **THEN** the action outcome form SHALL default to that daily action id

#### Scenario: Prefill outcome action from practice bucket
- **WHEN** the user selects a practice summary action bucket and opens a candidate without an existing latest action outcome
- **THEN** the action outcome form SHALL default to that bucket action id

#### Scenario: Preserve existing saved outcome
- **WHEN** the selected candidate already has a latest action outcome
- **THEN** the form SHALL show the saved action id and outcome text instead of overwriting them with transient context

#### Scenario: Keep action context scoped to workflow evidence
- **WHEN** action context is displayed or used to prefill the form
- **THEN** the UI SHALL label it as workflow action context and SHALL NOT present it as sales, demand, margin, ROI, score, market evidence, or a training grade
