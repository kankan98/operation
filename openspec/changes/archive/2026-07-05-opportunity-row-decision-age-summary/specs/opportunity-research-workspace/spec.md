## ADDED Requirements

### Requirement: Show decision age on opportunity rows
The opportunity research workspace UI SHALL show a concise row-level decision age summary for researched opportunities with current decision review metadata.

#### Scenario: Display row decision age
- **WHEN** an opportunity row has research metadata with a current decision and `decisionReview.daysSinceDecision`
- **THEN** the row SHALL show a neutral decision age label such as `今天决策`, `昨天决策`, or `N 天前决策`

#### Scenario: Avoid age for undecided rows
- **WHEN** an opportunity row has no current decision or no decision age metadata
- **THEN** the row SHALL NOT invent or infer a decision age summary

#### Scenario: Keep row decision age display-only
- **WHEN** a row-level decision age summary is displayed
- **THEN** the UI SHALL NOT change opportunity score, confidence, recommendation, recommendation gate, market signals, business metrics, factor contributions, persistence, stale filters, reminders, alerts, scheduled actions, streaks, training grades, AI coaching, analytics, or action history
