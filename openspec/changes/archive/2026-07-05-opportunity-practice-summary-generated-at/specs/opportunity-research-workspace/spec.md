## ADDED Requirements

### Requirement: Show practice summary generated time
The opportunity research workspace UI SHALL show the returned practice summary generation time when practice summary data is loaded.

#### Scenario: Display loaded practice summary generated time
- **WHEN** the practice summary strip has loaded summary data with `generatedAt`
- **THEN** the strip SHALL show the saved generated time with a neutral `汇总时间` label

#### Scenario: Preserve missing practice summary generated time state
- **WHEN** the practice summary is loading, missing, or has no saved `generatedAt`
- **THEN** the strip SHALL NOT invent, infer, generate, calculate, or backfill practice summary generated time from render time, daily action plan metadata, review summary metadata, action outcome metadata, decision metadata, score, recommendation, recommendation gates, market signals, or business metrics

#### Scenario: Keep practice summary generated time display-only
- **WHEN** practice summary generated time is displayed
- **THEN** the display SHALL NOT change score, confidence, recommendation, recommendation gates, market signals, business metrics, persistence, automation, reminders, alerts, scheduled actions, stale filters, streaks, training grades, AI coaching, analytics, historical tasks, or scoring inputs
