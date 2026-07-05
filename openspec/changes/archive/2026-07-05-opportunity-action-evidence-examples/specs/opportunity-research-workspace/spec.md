## ADDED Requirements

### Requirement: Show action outcome evidence examples
The opportunity research workspace UI SHALL show action-specific evidence examples while users record latest action outcome evidence.

#### Scenario: Display examples for selected action outcome type
- **WHEN** the user records an action outcome from the selected opportunity detail
- **THEN** the action outcome form SHALL show visible evidence examples aligned to the selected action id

#### Scenario: Update examples when action type changes
- **WHEN** the user changes the selected action outcome type before saving
- **THEN** the visible evidence examples SHALL update to match the newly selected action id

#### Scenario: Show examples for transient action context
- **WHEN** a daily action or practice bucket preselects an action outcome type for a candidate without a saved latest action outcome
- **THEN** the visible evidence examples SHALL match the preselected action id

#### Scenario: Show examples for saved outcome
- **WHEN** the selected candidate already has a saved latest action outcome
- **THEN** the visible evidence examples SHALL match the saved action outcome type

#### Scenario: Describe action outcome input with visible examples
- **WHEN** visible evidence examples are shown beside the action outcome input
- **THEN** the action outcome text field SHALL reference those examples as part of its accessible description

#### Scenario: Keep examples as manual guidance
- **WHEN** action outcome evidence examples are displayed
- **THEN** the UI SHALL NOT treat them as required templates, perform semantic validation, create reminders, alerts, scheduled actions, streaks, training grades, AI coaching, analytics, action history, scoring inputs, persistence changes, or changes to opportunity score, confidence, recommendation, recommendation gate, market signals, business metrics, or factor contributions
