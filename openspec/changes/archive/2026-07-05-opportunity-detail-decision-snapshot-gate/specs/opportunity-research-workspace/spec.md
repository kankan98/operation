## ADDED Requirements

### Requirement: Show decision snapshot gate context in selected opportunity detail
The opportunity research workspace UI SHALL show saved decision snapshot recommendation gate context in the selected opportunity decision detail when that saved snapshot includes gate evidence.

#### Scenario: Display selected detail snapshot gate status
- **WHEN** the selected opportunity has a current decision whose saved snapshot recommendation gate was applied, blocked, caution, or contains gate evidence
- **THEN** the decision detail SHALL show the saved snapshot gate status with a neutral `快照门控` label

#### Scenario: Display selected detail snapshot gate evidence
- **WHEN** the selected opportunity decision snapshot recommendation gate contains reasons, signals, or next actions
- **THEN** the decision detail SHALL show those saved gate reasons, signals, or next actions as saved snapshot gate context

#### Scenario: Preserve clear snapshot gate state
- **WHEN** the selected opportunity decision snapshot recommendation gate is clear and contains no applied state, reasons, signals, or next actions
- **THEN** the decision detail SHALL NOT invent, infer, generate, or backfill snapshot gate context from the current opportunity recommendation gate, score, missing signals, market signals, business metrics, notes, action outcomes, or decision review metadata

#### Scenario: Keep selected detail snapshot gate display-only
- **WHEN** selected detail snapshot gate context is displayed
- **THEN** the UI SHALL NOT change opportunity score, confidence, recommendation, recommendation gate, market signals, business metrics, factor contributions, persistence, reminders, alerts, scheduled actions, streaks, training grades, AI coaching, analytics, or action history
