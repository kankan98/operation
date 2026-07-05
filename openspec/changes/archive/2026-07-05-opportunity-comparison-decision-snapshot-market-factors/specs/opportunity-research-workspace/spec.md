## ADDED Requirements

### Requirement: Show decision snapshot market factors in opportunity comparison
The opportunity research workspace UI SHALL show saved decision snapshot market factor evidence in the opportunity comparison table when a current decision exists and the saved snapshot market signals contain factors.

#### Scenario: Display comparison decision snapshot market factors
- **WHEN** a compared opportunity has a current decision whose saved `decision.snapshot.marketSignals.factors` contains one or more factor entries
- **THEN** the comparison table decision column SHALL show saved factor labels, raw values, and explanations with neutral `快照市场因子` labels

#### Scenario: Preserve comparison null snapshot market factor state
- **WHEN** a compared opportunity has no current decision, saved snapshot market signals are null, or saved snapshot market factors are empty
- **THEN** the comparison table decision column SHALL NOT invent, infer, generate, calculate, or backfill snapshot market factors from current opportunity market signals, current market factors, current score, current recommendation, score factors, recommendation gates, business metrics, notes, action outcomes, decision review metadata, daily action plan metadata, or render time

#### Scenario: Preserve comparison snapshot market factor source
- **WHEN** current opportunity market factors differ from saved `decision.snapshot.marketSignals.factors`
- **THEN** the comparison table decision column SHALL use only the saved snapshot market factors for `快照市场因子` display

#### Scenario: Keep comparison decision snapshot market factors display-only
- **WHEN** comparison table decision snapshot market factors are displayed
- **THEN** the display SHALL NOT change score, confidence, recommendation, recommendation gates, market signals, business metrics, persistence, automation, reminders, alerts, scheduled actions, stale filters, streaks, training grades, AI coaching, analytics, historical tasks, or scoring inputs
