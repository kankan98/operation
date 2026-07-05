## ADDED Requirements

### Requirement: Show visible action outcome evidence prompt
The opportunity research workspace UI SHALL show the selected action's evidence-writing prompt as visible guidance while users record latest action outcome evidence.

#### Scenario: Display visible prompt for selected action
- **WHEN** the action outcome form is shown for a selected action type
- **THEN** the form SHALL show visible evidence-writing guidance aligned to that selected action type

#### Scenario: Update visible prompt when action changes
- **WHEN** the user changes the selected action outcome type before saving
- **THEN** the visible evidence-writing guidance SHALL update to match the newly selected action type

#### Scenario: Show visible prompt for transient context
- **WHEN** transient workflow action context preselects an action outcome type
- **THEN** the visible evidence-writing guidance SHALL match the preselected action type

#### Scenario: Show visible prompt for saved outcome
- **WHEN** the selected candidate already has a saved latest action outcome
- **THEN** the visible evidence-writing guidance SHALL match the saved action outcome type

#### Scenario: Keep visible prompt as manual guidance
- **WHEN** visible evidence-writing guidance is displayed
- **THEN** it SHALL NOT perform semantic validation, create reminders, alerts, scheduled actions, streaks, training grades, AI coaching, analytics, action history, scoring inputs, persistence changes, or changes to opportunity score, confidence, recommendation, recommendation gate, market signals, business metrics, or factor contributions
