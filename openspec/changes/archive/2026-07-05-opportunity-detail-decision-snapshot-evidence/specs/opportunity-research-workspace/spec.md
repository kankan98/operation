## ADDED Requirements

### Requirement: Show decision snapshot evidence in selected opportunity detail
The opportunity research workspace UI SHALL show saved decision snapshot evidence in the selected opportunity decision detail without recomputing or inferring it from current opportunity data.

#### Scenario: Display selected detail snapshot reasons
- **WHEN** the selected opportunity has a current decision whose saved snapshot contains one or more `keyReasons`
- **THEN** the decision detail SHALL show the saved snapshot reasons with a neutral `快照依据 · ...` label

#### Scenario: Display selected detail snapshot gaps
- **WHEN** the selected opportunity has a current decision whose saved snapshot contains one or more `missingSignals`
- **THEN** the decision detail SHALL show the saved snapshot gaps with a neutral `快照缺口 · ...` label

#### Scenario: Preserve empty snapshot evidence state
- **WHEN** the selected opportunity decision snapshot has empty `keyReasons` or `missingSignals`
- **THEN** the decision detail SHALL NOT invent, infer, generate, or backfill snapshot evidence from current opportunity key reasons, current missing signals, recommendation gates, market signals, business metrics, notes, action outcomes, or decision review metadata

#### Scenario: Keep selected detail snapshot evidence display-only
- **WHEN** selected detail snapshot evidence is displayed
- **THEN** the UI SHALL NOT change opportunity score, confidence, recommendation, recommendation gate, market signals, business metrics, factor contributions, persistence, reminders, alerts, scheduled actions, streaks, training grades, AI coaching, analytics, or action history
