## ADDED Requirements

### Requirement: Show decision snapshot gate details in opportunity comparison
The opportunity research workspace UI SHALL show saved decision snapshot recommendation gate detail evidence in the opportunity comparison table when a current decision exists and the saved snapshot recommendation gate contains detail context.

#### Scenario: Display comparison decision snapshot gate details
- **WHEN** a compared opportunity has a current decision whose saved `decision.snapshot.recommendationGate` contains one or more non-empty reasons, signals, or next actions
- **THEN** the comparison table decision column SHALL show saved gate reasons, signals, and next actions with neutral `快照门控原因`, `快照门控信号`, and `快照门控下一步` labels

#### Scenario: Preserve comparison clear snapshot gate detail state
- **WHEN** a compared opportunity has no current decision, the saved snapshot recommendation gate is clear, or the saved snapshot recommendation gate contains no non-empty reasons, signals, or next actions
- **THEN** the comparison table decision column SHALL NOT invent, infer, generate, calculate, or backfill snapshot gate details from current opportunity recommendation gates, current score, current recommendation, current missing signals, market signals, market factors, business metrics, notes, action outcomes, decision review metadata, daily action plan metadata, or render time

#### Scenario: Preserve comparison snapshot gate detail source
- **WHEN** current opportunity recommendation gate details differ from saved `decision.snapshot.recommendationGate` details
- **THEN** the comparison table decision column SHALL use only the saved snapshot recommendation gate reasons, signals, and next actions for `快照门控原因`, `快照门控信号`, and `快照门控下一步` display

#### Scenario: Keep comparison decision snapshot gate details display-only
- **WHEN** comparison table decision snapshot gate details are displayed
- **THEN** the display SHALL NOT change score, confidence, recommendation, recommendation gates, market signals, business metrics, persistence, automation, reminders, alerts, scheduled actions, stale filters, streaks, training grades, AI coaching, analytics, historical tasks, or scoring inputs
