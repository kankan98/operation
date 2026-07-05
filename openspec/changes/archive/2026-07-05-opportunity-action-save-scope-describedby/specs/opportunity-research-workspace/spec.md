## ADDED Requirements

### Requirement: Associate action outcome save controls with visible guidance
The opportunity research workspace UI SHALL associate the action outcome save control with visible save-scope and save-readiness guidance while users record latest action outcome evidence.

#### Scenario: Reference save scope from action outcome save control
- **WHEN** the action outcome form is shown for a selected opportunity
- **THEN** the action outcome save control SHALL reference the visible save-scope guidance as its accessible description

#### Scenario: Reference unavailable-save hint from disabled action outcome save control
- **WHEN** the action outcome save control is unavailable and a local save-readiness hint is visible
- **THEN** the action outcome save control SHALL reference that visible hint as part of its accessible description

#### Scenario: Keep save guidance display-only
- **WHEN** action outcome save guidance is referenced by the save control
- **THEN** the association SHALL NOT perform semantic validation, create reminders, alerts, scheduled actions, streaks, training grades, AI coaching, analytics, action history, scoring inputs, persistence changes, or changes to opportunity score, confidence, recommendation, recommendation gate, market signals, business metrics, or factor contributions
