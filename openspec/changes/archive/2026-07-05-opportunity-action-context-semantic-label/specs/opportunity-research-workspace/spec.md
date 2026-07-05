## ADDED Requirements

### Requirement: Expose action context semantic labels
The opportunity research workspace UI SHALL expose transient workflow action context as one semantic label when that context is displayed in the action outcome form.

#### Scenario: Label daily action context semantics
- **WHEN** the action outcome form is prefilled from a daily action context for a candidate without a saved latest action outcome
- **THEN** the displayed context SHALL expose a semantic label that includes the daily action source and the preselected action type

#### Scenario: Label practice bucket context semantics
- **WHEN** the action outcome form is prefilled from a practice bucket context for a candidate without a saved latest action outcome
- **THEN** the displayed context SHALL expose a semantic label that includes the practice bucket source and the preselected action type

#### Scenario: Label manual override semantics
- **WHEN** the user manually chooses an action outcome type that differs from the transient workflow action context before saving
- **THEN** the displayed context SHALL expose a semantic label that includes the original preselected action type and the current action type that will be saved

#### Scenario: Preserve saved outcome priority
- **WHEN** the selected candidate already has a saved latest action outcome
- **THEN** the form SHALL show the saved action outcome and SHALL NOT expose a transient action context semantic label

#### Scenario: Keep semantic label display-only
- **WHEN** an action context semantic label is exposed
- **THEN** it SHALL NOT change opportunity score, confidence, recommendation, recommendation gate, market signals, business metrics, factor contributions, action outcome persistence, reminders, alerts, schedules, analytics, action history, AI coaching, or training grades
