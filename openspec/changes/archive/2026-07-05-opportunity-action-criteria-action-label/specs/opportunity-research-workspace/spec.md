## ADDED Requirements

### Requirement: Label action outcome completion criteria action
The opportunity research workspace UI SHALL identify which selected daily action type the action outcome completion criteria apply to.

#### Scenario: Display selected action on completion criteria
- **WHEN** the action outcome form displays completion criteria for a selected action type
- **THEN** the completion criteria panel SHALL show the selected action type label

#### Scenario: Update completion criteria action label
- **WHEN** the user changes the selected action outcome type before saving
- **THEN** the completion criteria action label SHALL update to match the newly selected action type

#### Scenario: Label transient context criteria
- **WHEN** transient workflow action context preselects an action outcome type
- **THEN** the completion criteria panel SHALL show the preselected action type label

#### Scenario: Label saved outcome criteria
- **WHEN** the selected candidate already has a saved latest action outcome
- **THEN** the completion criteria panel SHALL show the saved action outcome type label

#### Scenario: Keep criteria action label display-only
- **WHEN** the completion criteria action label is displayed
- **THEN** it SHALL NOT change opportunity score, confidence, recommendation, recommendation gate, market signals, business metrics, factor contributions, action outcome persistence, reminders, alerts, schedules, analytics, action history, AI coaching, or training grades
