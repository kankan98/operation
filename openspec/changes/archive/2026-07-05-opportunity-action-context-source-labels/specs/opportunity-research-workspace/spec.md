## ADDED Requirements

### Requirement: Show action context source labels
The opportunity research workspace UI SHALL show the source of transient workflow action context when that context preselects an action outcome type.

#### Scenario: Label daily action context source
- **WHEN** the action outcome form is prefilled from a selected daily action plan item
- **THEN** the form SHALL show a source label indicating the context came from a daily action plan

#### Scenario: Label practice bucket context source
- **WHEN** the action outcome form is prefilled from a selected practice summary action bucket
- **THEN** the form SHALL show a source label indicating the context came from a practice bucket

#### Scenario: Preserve saved outcome priority
- **WHEN** the selected candidate already has a saved latest action outcome
- **THEN** the form SHALL show the saved action outcome and SHALL NOT show a transient action context source label

#### Scenario: Keep context source labels display-only
- **WHEN** an action context source label is displayed
- **THEN** it SHALL NOT change opportunity score, confidence, recommendation, recommendation gate, market signals, business metrics, factor contributions, action outcome persistence, reminders, alerts, schedules, analytics, action history, or training grades
