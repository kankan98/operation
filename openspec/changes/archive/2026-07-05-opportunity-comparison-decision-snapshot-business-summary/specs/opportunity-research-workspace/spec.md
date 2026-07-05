## ADDED Requirements

### Requirement: Show decision snapshot business summary in opportunity comparison
The opportunity research workspace UI SHALL show saved decision snapshot business completeness and missing business signals in the opportunity comparison table when a current decision exists and the saved snapshot contains business signal context.

#### Scenario: Display comparison decision snapshot business completeness
- **WHEN** a compared opportunity has a current decision with saved `decision.snapshot.businessSignals.completeness`
- **THEN** the comparison table decision column SHALL show the saved completeness with a neutral `快照业务完整度` label

#### Scenario: Display comparison decision snapshot business gaps
- **WHEN** a compared opportunity has a current decision with saved non-empty `decision.snapshot.businessSignals.missingSignals`
- **THEN** the comparison table decision column SHALL show the saved missing business signals with a neutral `快照业务缺口` label

#### Scenario: Preserve comparison decision snapshot business source
- **WHEN** current opportunity business signals differ from saved `decision.snapshot.businessSignals`
- **THEN** the comparison table decision column SHALL use only the saved snapshot business signals for `快照业务完整度` and `快照业务缺口`

#### Scenario: Avoid inferred comparison decision snapshot business summary
- **WHEN** a compared opportunity has no current decision or the saved decision snapshot has null or missing `businessSignals`
- **THEN** the comparison table decision column SHALL NOT invent, infer, generate, or backfill snapshot business summary from current business signals, current business metrics, current score, current recommendation, score factors, recommendation gates, market signals, notes, action outcomes, decision review metadata, daily action plan metadata, or render time

#### Scenario: Keep comparison decision snapshot business summary display-only
- **WHEN** comparison table decision snapshot business summary is displayed
- **THEN** the display SHALL NOT change score, confidence, recommendation, recommendation gates, market signals, business metrics, persistence, automation, reminders, alerts, scheduled actions, stale filters, streaks, training grades, AI coaching, analytics, historical tasks, or scoring inputs
