## ADDED Requirements

### Requirement: Show action outcome recency labels
The opportunity research workspace UI SHALL show display-only recency labels for latest action outcome completion timestamps so users can scan workflow evidence freshness.

#### Scenario: Display selected outcome recency
- **WHEN** the selected opportunity has a latest action outcome
- **THEN** the selected detail action outcome panel SHALL show a day-level recency label alongside the completion timestamp

#### Scenario: Display compact summary recency
- **WHEN** an opportunity research summary shows a latest action outcome
- **THEN** the summary SHALL include a day-level recency label for the latest action outcome

#### Scenario: Use neutral recency labels
- **WHEN** action outcome recency labels are displayed
- **THEN** the UI SHALL present them as neutral workflow evidence metadata and SHALL NOT create stale filters, reminders, alerts, streaks, training grades, AI coaching, analytics, scoring inputs, or additional persistence
