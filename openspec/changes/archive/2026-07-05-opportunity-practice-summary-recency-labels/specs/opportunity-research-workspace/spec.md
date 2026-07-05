## ADDED Requirements

### Requirement: Show practice summary latest completion recency
The opportunity research workspace UI SHALL show a display-only recency label for the practice summary latest completion timestamp.

#### Scenario: Display practice summary latest recency
- **WHEN** the practice summary has a latest action completion timestamp
- **THEN** the practice summary latest completion card SHALL show a day-level recency label as the primary value and keep the absolute completion time visible as secondary detail

#### Scenario: Preserve empty latest completion state
- **WHEN** the practice summary has no latest action completion timestamp
- **THEN** the practice summary latest completion card SHALL continue to show an empty state instead of a recency label

#### Scenario: Keep summary recency neutral
- **WHEN** the practice summary latest completion recency label is displayed
- **THEN** the UI SHALL present it as neutral workflow evidence metadata and SHALL NOT create stale filters, reminders, alerts, streaks, training grades, AI coaching, analytics, scoring inputs, or additional persistence
