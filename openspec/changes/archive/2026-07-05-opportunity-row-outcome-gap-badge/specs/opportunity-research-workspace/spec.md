## ADDED Requirements

### Requirement: Show missing action outcome on opportunity rows
The opportunity research workspace UI SHALL show neutral row-level workflow practice evidence when an active researched opportunity is missing a latest daily action outcome.

#### Scenario: Display missing outcome indicator on active researched row
- **WHEN** an opportunity row has an active non-archived research entry with no latest action outcome
- **THEN** the row SHALL show a neutral missing-action-outcome indicator as workflow practice evidence

#### Scenario: Preserve existing outcome row summary
- **WHEN** an opportunity row has a latest action outcome
- **THEN** the row SHALL continue to show the action label, recency label, and outcome text instead of the missing-action-outcome indicator

#### Scenario: Keep row indicator neutral
- **WHEN** the missing-action-outcome indicator is displayed
- **THEN** the UI SHALL NOT create stale filters, reminders, alerts, streaks, training grades, AI coaching, analytics, scoring inputs, or additional persistence
