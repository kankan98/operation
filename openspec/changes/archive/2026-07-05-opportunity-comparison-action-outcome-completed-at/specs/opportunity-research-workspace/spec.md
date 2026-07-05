## ADDED Requirements

### Requirement: Show action outcome completion time in opportunity comparison
The opportunity research workspace UI SHALL show saved latest action outcome completion time in the opportunity comparison table when a compared opportunity has a saved latest action outcome.

#### Scenario: Display comparison latest action outcome completion time
- **WHEN** a compared opportunity has research metadata with a saved `lastActionOutcome.completedAt`
- **THEN** the comparison table action outcome column SHALL show the saved completion time with a neutral `完成时间` label

#### Scenario: Preserve missing comparison outcome completion time state
- **WHEN** a compared opportunity has no research metadata, no saved `lastActionOutcome`, or no saved `lastActionOutcome.completedAt`
- **THEN** the comparison table SHALL NOT invent, infer, generate, calculate, or backfill action outcome completion time from notes, decisions, decision review metadata, daily action plan metadata, practice summary counts, score, recommendation, recommendation gates, market signals, business metrics, action outcome update time, or render time

#### Scenario: Keep comparison action outcome completion time display-only
- **WHEN** comparison table latest action outcome completion time is displayed
- **THEN** the display SHALL NOT change score, confidence, recommendation, recommendation gates, market signals, business metrics, persistence, automation, reminders, alerts, scheduled actions, stale filters, streaks, training grades, AI coaching, analytics, historical tasks, or scoring inputs
