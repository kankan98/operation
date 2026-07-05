## ADDED Requirements

### Requirement: Show decision snapshot confidence in selected opportunity detail
The opportunity research workspace UI SHALL show saved decision snapshot confidence in the selected opportunity decision detail without recomputing or inferring it from current opportunity data.

#### Scenario: Display selected detail snapshot confidence
- **WHEN** the selected opportunity has a current decision with saved snapshot confidence
- **THEN** the decision detail SHALL show the saved snapshot confidence with a neutral `快照置信度` label

#### Scenario: Preserve snapshot confidence source
- **WHEN** current opportunity confidence differs from the saved decision snapshot confidence
- **THEN** the decision detail SHALL use the saved snapshot confidence for the `快照置信度` value

#### Scenario: Keep selected detail snapshot confidence display-only
- **WHEN** selected detail snapshot confidence is displayed
- **THEN** the UI SHALL NOT change opportunity score, confidence, recommendation, recommendation gate, market signals, business metrics, factor contributions, persistence, reminders, alerts, scheduled actions, streaks, training grades, AI coaching, analytics, or action history
