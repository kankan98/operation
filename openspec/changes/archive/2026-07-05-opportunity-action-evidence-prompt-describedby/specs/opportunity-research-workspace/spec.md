## ADDED Requirements

### Requirement: Associate action outcome evidence prompt with input
The opportunity research workspace UI SHALL associate the visible selected action evidence prompt with the action outcome input as descriptive text while users record latest action outcome evidence.

#### Scenario: Reference visible prompt from action outcome input
- **WHEN** the action outcome form is shown for a selected action type
- **THEN** the action outcome text field SHALL reference the visible evidence-writing guidance as its accessible description

#### Scenario: Keep associated prompt synchronized with action selection
- **WHEN** the selected action outcome type changes before saving
- **THEN** the action outcome text field's accessible description SHALL continue to reference the visible evidence-writing guidance for the current selected action type

#### Scenario: Keep accessible prompt as manual guidance
- **WHEN** the action outcome input references the visible evidence-writing guidance
- **THEN** the association SHALL NOT perform semantic validation, create reminders, alerts, scheduled actions, streaks, training grades, AI coaching, analytics, action history, scoring inputs, persistence changes, or changes to opportunity score, confidence, recommendation, recommendation gate, market signals, business metrics, or factor contributions
