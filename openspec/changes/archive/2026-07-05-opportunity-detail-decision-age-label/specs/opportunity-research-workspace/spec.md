## ADDED Requirements

### Requirement: Show neutral decision age in selected opportunity detail
The opportunity research workspace UI SHALL show neutral day-level decision age labels in the selected opportunity decision detail when current decision review metadata is available.

#### Scenario: Display selected detail decision age
- **WHEN** the selected opportunity has a current decision and `decisionReview.daysSinceDecision`
- **THEN** the decision detail SHALL show a neutral label such as `今天决策`, `昨天决策`, or `N 天前决策`

#### Scenario: Preserve selected detail no-decision state
- **WHEN** the selected opportunity has no current decision or no decision age metadata
- **THEN** the decision detail SHALL continue to show the no-current-decision state instead of inventing a decision age

#### Scenario: Keep selected detail decision age display-only
- **WHEN** the selected detail decision age label is displayed
- **THEN** the UI SHALL NOT change opportunity score, confidence, recommendation, recommendation gate, market signals, business metrics, factor contributions, persistence, stale filters, reminders, alerts, scheduled actions, streaks, training grades, AI coaching, analytics, or action history
