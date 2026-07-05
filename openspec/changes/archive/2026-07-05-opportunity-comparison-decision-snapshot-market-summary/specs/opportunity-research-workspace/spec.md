## ADDED Requirements

### Requirement: Show decision snapshot market summary in opportunity comparison
The opportunity research workspace UI SHALL show saved decision snapshot market summary in the opportunity comparison table when a current decision exists and the saved snapshot contains market signal context.

#### Scenario: Display comparison decision snapshot market status
- **WHEN** a compared opportunity has a current decision whose saved snapshot contains `marketSignals`
- **THEN** the comparison table decision column SHALL show the saved market status with a neutral `快照市场状态` label

#### Scenario: Display comparison decision snapshot market provenance
- **WHEN** a compared opportunity has a current decision whose saved snapshot market signals contain provider, source, confidence, freshness, or missing signal values
- **THEN** the comparison table decision column SHALL show the available saved market provenance values with neutral `快照市场来源`, `快照市场置信度`, `快照市场新鲜度`, and `快照市场缺口` labels

#### Scenario: Preserve comparison decision snapshot market source
- **WHEN** current opportunity market signals differ from saved `decision.snapshot.marketSignals`
- **THEN** the comparison table decision column SHALL use only the saved snapshot market signals for `快照市场...` display

#### Scenario: Avoid inferred comparison decision snapshot market summary
- **WHEN** a compared opportunity has no current decision or the saved decision snapshot has null or missing `marketSignals`
- **THEN** the comparison table decision column SHALL NOT invent, infer, generate, calculate, or backfill snapshot market summary from current market signals, current market factors, current score, current recommendation, score factors, recommendation gates, business metrics, notes, action outcomes, decision review metadata, daily action plan metadata, or render time

#### Scenario: Keep comparison decision snapshot market summary display-only
- **WHEN** comparison table decision snapshot market summary is displayed
- **THEN** the display SHALL NOT change score, confidence, recommendation, recommendation gates, market signals, business metrics, persistence, automation, reminders, alerts, scheduled actions, stale filters, streaks, training grades, AI coaching, analytics, historical tasks, or scoring inputs
