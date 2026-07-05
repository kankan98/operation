## ADDED Requirements

### Requirement: Show missing action outcome in selected opportunity detail
The opportunity research workspace UI SHALL show neutral selected-detail workflow practice evidence when an active researched opportunity is missing a latest daily action outcome.

#### Scenario: Display selected detail missing outcome indicator
- **WHEN** the selected opportunity has an active non-archived research entry with no latest action outcome
- **THEN** the selected detail action outcome panel SHALL show a neutral `待补行动结果` indicator as workflow practice evidence

#### Scenario: Preserve saved outcome detail
- **WHEN** the selected opportunity has a latest action outcome
- **THEN** the selected detail action outcome panel SHALL continue to show the action label, completion timestamp, recency label, and outcome text instead of the missing-outcome indicator

#### Scenario: Avoid inactive outcome gaps
- **WHEN** the selected opportunity is not researched or its research entry is archived
- **THEN** the selected detail action outcome panel SHALL NOT show the active missing-outcome indicator

#### Scenario: Keep selected detail indicator neutral
- **WHEN** the selected detail missing-outcome indicator is displayed
- **THEN** the UI SHALL NOT create stale filters, reminders, alerts, scheduled actions, streaks, training grades, AI coaching, analytics, action history, scoring inputs, persistence changes, or changes to opportunity score, confidence, recommendation, recommendation gate, market signals, business metrics, or factor contributions
