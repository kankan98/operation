## ADDED Requirements

### Requirement: Guide workflow evidence text length in opportunity workspace UI
The opportunity research workspace UI SHALL show bounded text length guidance for manual decision and action outcome evidence before the user saves it.

#### Scenario: Display decision text length guidance
- **WHEN** the user edits a selected opportunity decision reason or next action
- **THEN** the decision form SHALL show the current text length and configured maximum for each field near the corresponding input

#### Scenario: Display action outcome text length guidance
- **WHEN** the user edits the selected opportunity latest action outcome
- **THEN** the action outcome form SHALL show the current text length and configured maximum near the outcome input

#### Scenario: Prevent over-limit evidence submission
- **WHEN** a decision reason, decision next action, or action outcome exceeds its configured maximum length
- **THEN** the workspace SHALL disable the relevant save action instead of knowingly submitting over-limit workflow evidence

#### Scenario: Keep length guidance neutral
- **WHEN** text length guidance is displayed or used to disable saving
- **THEN** the UI SHALL NOT perform semantic validation, create reminders, alerts, scheduled actions, streaks, training grades, AI coaching, analytics, action history, scoring inputs, persistence changes, or changes to opportunity score, confidence, recommendation, recommendation gate, market signals, business metrics, or factor contributions
