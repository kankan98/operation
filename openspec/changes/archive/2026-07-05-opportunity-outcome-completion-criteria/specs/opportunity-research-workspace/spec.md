## ADDED Requirements

### Requirement: Show action outcome completion criteria
The opportunity research workspace UI SHALL show deterministic completion criteria for the selected daily action while the user records latest action outcome evidence.

#### Scenario: Display criteria for selected action outcome type
- **WHEN** the user records an action outcome from the selected opportunity detail
- **THEN** the action outcome form SHALL display the selected action id's completion criteria near the outcome entry fields

#### Scenario: Update criteria when action type changes
- **WHEN** the user changes the selected action outcome type
- **THEN** the displayed completion criteria SHALL update to match the newly selected action id

#### Scenario: Show criteria for transient action context
- **WHEN** a daily action or practice bucket preselects an action outcome type for a candidate without a saved latest action outcome
- **THEN** the action outcome form SHALL display completion criteria for that preselected action id

#### Scenario: Keep criteria as workflow guidance
- **WHEN** completion criteria are displayed in the action outcome form
- **THEN** the UI SHALL present them as workflow practice guidance and SHALL NOT turn them into reminders, streaks, training grades, AI coaching, analytics, scoring inputs, or additional persistence
