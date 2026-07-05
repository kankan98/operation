## ADDED Requirements

### Requirement: Show action outcome evidence prompts
The opportunity research workspace UI SHALL provide static evidence-writing prompts for the selected daily action while the user records latest action outcome evidence.

#### Scenario: Display prompt for selected action outcome type
- **WHEN** the user records an action outcome from the selected opportunity detail
- **THEN** the action outcome text field SHALL expose a prompt aligned to the selected action id

#### Scenario: Update prompt when action type changes
- **WHEN** the user changes the selected action outcome type
- **THEN** the action outcome prompt SHALL update to match the newly selected action id

#### Scenario: Show prompt for transient action context
- **WHEN** a daily action or practice bucket preselects an action outcome type for a candidate without a saved latest action outcome
- **THEN** the action outcome text field SHALL expose the prompt for that preselected action id

#### Scenario: Keep prompts as manual evidence guidance
- **WHEN** action outcome prompts are displayed
- **THEN** the UI SHALL NOT use them for semantic validation, reminders, streaks, training grades, AI coaching, analytics, scoring inputs, or additional persistence
