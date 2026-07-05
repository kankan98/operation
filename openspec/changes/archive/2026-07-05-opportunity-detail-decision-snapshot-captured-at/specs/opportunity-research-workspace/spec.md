## ADDED Requirements

### Requirement: Show decision snapshot capture time in selected opportunity detail
The opportunity research workspace UI SHALL show the saved decision snapshot capture time in the selected opportunity decision detail without recomputing or inferring it from current opportunity data.

#### Scenario: Display selected detail snapshot capture time
- **WHEN** the selected opportunity has a current decision with a saved snapshot `capturedAt` timestamp
- **THEN** the decision detail SHALL show that saved timestamp with a neutral `快照时间 · ...` label

#### Scenario: Preserve snapshot capture time source
- **WHEN** the saved snapshot `capturedAt` differs from decision `decidedAt`, decision `updatedAt`, current opportunity timestamps, or the current render time
- **THEN** the decision detail SHALL use the saved snapshot `capturedAt` value for the `快照时间` display

#### Scenario: Keep selected detail snapshot capture time display-only
- **WHEN** selected detail snapshot capture time is displayed
- **THEN** the UI SHALL NOT change opportunity score, confidence, recommendation, recommendation gate, market signals, business metrics, factor contributions, persistence, reminders, alerts, scheduled actions, streaks, training grades, AI coaching, analytics, or action history
