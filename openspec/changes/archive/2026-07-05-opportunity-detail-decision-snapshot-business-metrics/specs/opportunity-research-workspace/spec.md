## ADDED Requirements

### Requirement: Show decision snapshot business metrics in selected opportunity detail
The opportunity research workspace UI SHALL show saved decision snapshot business metric values in the selected opportunity decision detail without recomputing or inferring them from current opportunity data.

#### Scenario: Display selected detail snapshot business metrics
- **WHEN** the selected opportunity has a current decision whose saved snapshot business signals contain metrics
- **THEN** the decision detail SHALL show saved assumption-based business metric values with neutral `快照业务指标` labels

#### Scenario: Preserve null snapshot business metrics state
- **WHEN** the selected opportunity decision snapshot business signals have `metrics` set to `null`
- **THEN** the decision detail SHALL NOT invent, infer, generate, or backfill snapshot business metrics from current opportunity business signals, current business metrics, score factors, recommendation gates, market signals, notes, action outcomes, or decision review metadata

#### Scenario: Preserve snapshot business metric source
- **WHEN** current opportunity business metric values differ from the saved decision snapshot business metric values
- **THEN** the decision detail SHALL use the saved snapshot metric values for the `快照业务指标` display

#### Scenario: Keep selected detail snapshot business metrics display-only
- **WHEN** selected detail snapshot business metrics are displayed
- **THEN** the UI SHALL NOT change opportunity score, confidence, recommendation, recommendation gate, market signals, business metrics, factor contributions, persistence, reminders, alerts, scheduled actions, streaks, training grades, AI coaching, analytics, or action history
