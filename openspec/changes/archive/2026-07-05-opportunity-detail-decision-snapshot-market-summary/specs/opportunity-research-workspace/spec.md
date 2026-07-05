## ADDED Requirements

### Requirement: Show decision snapshot market summary in selected opportunity detail
The opportunity research workspace UI SHALL show saved decision snapshot market summary in the selected opportunity decision detail without recomputing or inferring it from current opportunity data.

#### Scenario: Display selected detail snapshot market status
- **WHEN** the selected opportunity has a current decision whose saved snapshot contains `marketSignals`
- **THEN** the decision detail SHALL show the saved snapshot market status with a neutral `快照市场状态 · ...` label

#### Scenario: Display selected detail snapshot market context
- **WHEN** the selected opportunity decision snapshot contains market provider, source, confidence, freshness, or missing-signal context
- **THEN** the decision detail SHALL show those saved snapshot market fields as neutral historical evidence labels

#### Scenario: Preserve null snapshot market state
- **WHEN** the selected opportunity decision snapshot has `marketSignals` set to `null`
- **THEN** the decision detail SHALL NOT invent, infer, generate, or backfill snapshot market context from current opportunity market signals, current missing signals, recommendation gates, business metrics, notes, action outcomes, or decision review metadata

#### Scenario: Keep selected detail snapshot market summary display-only
- **WHEN** selected detail snapshot market summary is displayed
- **THEN** the UI SHALL NOT change opportunity score, confidence, recommendation, recommendation gate, market signals, business metrics, factor contributions, persistence, reminders, alerts, scheduled actions, streaks, training grades, AI coaching, analytics, or action history
