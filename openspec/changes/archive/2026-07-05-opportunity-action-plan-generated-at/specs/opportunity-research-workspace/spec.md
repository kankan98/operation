## ADDED Requirements

### Requirement: Show daily action plan generated time
The opportunity research workspace UI SHALL show the returned daily action plan generation time when a daily action plan is loaded.

#### Scenario: Display loaded daily action plan generated time
- **WHEN** the daily action plan panel has a loaded plan with `generatedAt`
- **THEN** the panel SHALL show the saved generated time with a neutral `计划时间` label

#### Scenario: Preserve missing daily action plan generated time state
- **WHEN** the daily action plan is loading, missing, or has no saved `generatedAt`
- **THEN** the panel SHALL NOT invent, infer, generate, calculate, or backfill daily action plan generated time from render time, review summary metadata, practice summary metadata, action outcome metadata, decision metadata, score, recommendation, recommendation gates, market signals, or business metrics

#### Scenario: Keep daily action plan generated time display-only
- **WHEN** daily action plan generated time is displayed
- **THEN** the display SHALL NOT change score, confidence, recommendation, recommendation gates, market signals, business metrics, persistence, automation, reminders, alerts, scheduled actions, stale filters, streaks, training grades, AI coaching, analytics, historical tasks, or scoring inputs
