## ADDED Requirements

### Requirement: Show decision snapshot confidence in opportunity comparison
The opportunity research workspace UI SHALL show saved decision snapshot confidence in the opportunity comparison table when a current decision exists.

#### Scenario: Display comparison decision snapshot confidence
- **WHEN** a compared opportunity has research metadata with a current decision and saved decision snapshot confidence
- **THEN** the comparison table decision column SHALL show the saved snapshot confidence with a neutral `快照置信度` label

#### Scenario: Preserve comparison snapshot confidence source
- **WHEN** the saved decision snapshot confidence differs from the current opportunity confidence
- **THEN** the comparison table decision column SHALL use the saved decision snapshot confidence for the `快照置信度` display

#### Scenario: Avoid inferred comparison snapshot confidence
- **WHEN** a compared opportunity has no current decision
- **THEN** the comparison table decision column SHALL NOT invent, infer, generate, or backfill snapshot confidence from current confidence, score, recommendation, gates, market signals, business metrics, notes, action outcomes, review metadata, daily action plan metadata, or render time

#### Scenario: Keep comparison decision snapshot confidence display-only
- **WHEN** a comparison table decision snapshot confidence is displayed
- **THEN** the UI SHALL NOT change opportunity score, confidence, recommendation, recommendation gate, market signals, business metrics, factor contributions, persistence, reminders, alerts, scheduled actions, stale filters, streaks, training grades, AI coaching, analytics, action history, or scoring input
