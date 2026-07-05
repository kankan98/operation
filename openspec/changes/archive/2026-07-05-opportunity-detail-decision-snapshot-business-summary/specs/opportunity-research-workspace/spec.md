## ADDED Requirements

### Requirement: Show decision snapshot business summary in selected opportunity detail
The opportunity research workspace UI SHALL show saved decision snapshot business summary context in the selected opportunity decision detail without recomputing or inferring it from current opportunity data.

#### Scenario: Display selected detail snapshot business completeness
- **WHEN** the selected opportunity has a current decision with saved snapshot business signals
- **THEN** the decision detail SHALL show the saved business completeness with a neutral `快照业务完整度` label

#### Scenario: Display selected detail snapshot business gaps
- **WHEN** the selected opportunity decision snapshot business signals contain missing signals
- **THEN** the decision detail SHALL show those saved missing business signals with a neutral `快照业务缺口` label

#### Scenario: Preserve snapshot business source
- **WHEN** current opportunity business signals differ from the saved decision snapshot business signals
- **THEN** the decision detail SHALL use the saved snapshot business signals for the `快照业务完整度` and `快照业务缺口` values

#### Scenario: Keep selected detail snapshot business summary display-only
- **WHEN** selected detail snapshot business summary context is displayed
- **THEN** the UI SHALL NOT change opportunity score, confidence, recommendation, recommendation gate, market signals, business metrics, factor contributions, persistence, reminders, alerts, scheduled actions, streaks, training grades, AI coaching, analytics, or action history
