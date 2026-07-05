## ADDED Requirements

### Requirement: Show review summary generated time
The opportunity research workspace UI SHALL show the returned review summary generation time when review summary data is loaded.

#### Scenario: Display loaded review summary generated time
- **WHEN** the review summary cards have loaded summary data with `generatedAt`
- **THEN** the cards SHALL show the saved generated time with a neutral `汇总时间` label

#### Scenario: Preserve missing review summary generated time state
- **WHEN** the review summary is loading, missing, or has no saved `generatedAt`
- **THEN** the cards SHALL NOT invent, infer, generate, calculate, or backfill review summary generated time from render time, daily action plan metadata, practice summary metadata, action outcome metadata, decision metadata, score, recommendation, recommendation gates, market signals, or business metrics

#### Scenario: Keep review summary generated time display-only
- **WHEN** review summary generated time is displayed
- **THEN** the display SHALL NOT change score, confidence, recommendation, recommendation gates, market signals, business metrics, persistence, automation, reminders, alerts, scheduled actions, stale filters, streaks, training grades, AI coaching, analytics, historical tasks, or scoring inputs
