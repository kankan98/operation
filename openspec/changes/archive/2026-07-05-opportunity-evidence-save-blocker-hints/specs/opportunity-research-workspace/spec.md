## ADDED Requirements

### Requirement: Explain unavailable evidence saves in opportunity workspace UI
The opportunity research workspace UI SHALL show concise local save-readiness guidance when selected opportunity decision or action outcome evidence cannot currently be saved.

#### Scenario: Explain unavailable decision save
- **WHEN** the selected opportunity decision save action is unavailable because required decision evidence is missing or over the configured text limit
- **THEN** the decision form SHALL show a concise reason near the save controls

#### Scenario: Explain unavailable action outcome save
- **WHEN** the selected opportunity action outcome save action is unavailable because the research entry is missing, the outcome text is missing or over the configured text limit, or the completion date is missing, invalid, or future-dated
- **THEN** the action outcome form SHALL show a concise reason near the save controls

#### Scenario: Hide blocker when evidence can be saved
- **WHEN** the selected opportunity decision or action outcome save action is available
- **THEN** the form SHALL hide the local blocker hint for that save action

#### Scenario: Keep blocker hints neutral
- **WHEN** save blocker hints are displayed
- **THEN** the UI SHALL NOT perform semantic validation, create reminders, alerts, scheduled actions, streaks, training grades, AI coaching, analytics, action history, scoring inputs, persistence changes, or changes to opportunity score, confidence, recommendation, recommendation gate, market signals, business metrics, or factor contributions
