## ADDED Requirements

### Requirement: Show action outcome completion time on opportunity rows
The opportunity research workspace UI SHALL show saved latest action outcome completion time in opportunity list row research summaries when a row has a saved latest action outcome.

#### Scenario: Display row latest action outcome completion time
- **WHEN** an opportunity row has research metadata with a saved `lastActionOutcome.completedAt`
- **THEN** the row research summary SHALL show the saved completion time with a neutral `完成时间` label

#### Scenario: Preserve missing row outcome completion time state
- **WHEN** an opportunity row has no research metadata, no saved `lastActionOutcome`, or no saved `lastActionOutcome.completedAt`
- **THEN** the row research summary SHALL NOT invent, infer, generate, calculate, or backfill action outcome completion time from notes, decisions, decision review metadata, daily action plan metadata, practice summary counts, score, recommendation, recommendation gates, market signals, business metrics, action outcome update time, or render time

#### Scenario: Keep row action outcome completion time display-only
- **WHEN** row latest action outcome completion time is displayed
- **THEN** the display SHALL NOT change score, confidence, recommendation, recommendation gates, market signals, business metrics, persistence, automation, reminders, alerts, scheduled actions, stale filters, streaks, training grades, AI coaching, analytics, historical tasks, or scoring inputs
