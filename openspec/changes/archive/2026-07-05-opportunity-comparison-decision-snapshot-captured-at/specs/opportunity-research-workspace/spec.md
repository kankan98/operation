## ADDED Requirements

### Requirement: Show decision snapshot capture time in opportunity comparison
The opportunity research workspace UI SHALL show saved decision snapshot capture time in the opportunity comparison table when a current decision exists.

#### Scenario: Display comparison decision snapshot capture time
- **WHEN** a compared opportunity has research metadata with a current decision and saved decision snapshot capture time
- **THEN** the comparison table decision column SHALL show the saved snapshot capture time with a neutral `快照时间` label

#### Scenario: Preserve comparison snapshot capture time source
- **WHEN** the saved decision snapshot capture time differs from the decision record time, decision update time, current opportunity data, or render time
- **THEN** the comparison table decision column SHALL use the saved decision snapshot capture time for the `快照时间` display

#### Scenario: Avoid inferred comparison snapshot capture time
- **WHEN** a compared opportunity has no current decision
- **THEN** the comparison table decision column SHALL NOT invent, infer, generate, or backfill snapshot capture time from decision review metadata, decision record time, decision update time, current opportunity data, current render time, score, recommendation, gates, market signals, business metrics, notes, action outcomes, or daily action plan metadata

#### Scenario: Keep comparison decision snapshot capture time display-only
- **WHEN** a comparison table decision snapshot capture time is displayed
- **THEN** the UI SHALL NOT change opportunity score, confidence, recommendation, recommendation gate, market signals, business metrics, factor contributions, persistence, reminders, alerts, scheduled actions, stale filters, streaks, training grades, AI coaching, analytics, action history, or scoring input
