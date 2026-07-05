## ADDED Requirements

### Requirement: Show decision snapshot market factors in selected opportunity detail
The opportunity research workspace UI SHALL show saved decision snapshot market factors in the selected opportunity decision detail without recomputing or inferring them from current opportunity data.

#### Scenario: Display selected detail snapshot market factors
- **WHEN** the selected opportunity has a current decision whose saved snapshot market signals contain one or more factors
- **THEN** the decision detail SHALL show saved factor labels, values, and explanations with neutral `快照市场因子` labels

#### Scenario: Preserve empty snapshot market factors state
- **WHEN** the selected opportunity decision snapshot market signals are `null` or contain an empty `factors` array
- **THEN** the decision detail SHALL NOT invent, infer, generate, or backfill snapshot market factors from current opportunity market signals, current score factors, recommendation gates, business metrics, notes, action outcomes, or decision review metadata

#### Scenario: Preserve snapshot market factor source
- **WHEN** current opportunity market factors differ from the saved decision snapshot market factors
- **THEN** the decision detail SHALL use the saved snapshot market factors for the `快照市场因子` display

#### Scenario: Keep selected detail snapshot market factors display-only
- **WHEN** selected detail snapshot market factors are displayed
- **THEN** the UI SHALL NOT change opportunity score, confidence, recommendation, recommendation gate, market signals, business metrics, factor contributions, persistence, reminders, alerts, scheduled actions, streaks, training grades, AI coaching, analytics, or action history
