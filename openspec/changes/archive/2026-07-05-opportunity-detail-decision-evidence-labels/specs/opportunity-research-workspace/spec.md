## ADDED Requirements

### Requirement: Label decision evidence in selected opportunity detail
The opportunity research workspace UI SHALL show neutral labels for saved decision evidence in the selected opportunity decision detail.

#### Scenario: Display selected detail decision reason label
- **WHEN** the selected opportunity has a current decision reason
- **THEN** the decision detail SHALL show the saved reason with a neutral `决策依据 · ...` label

#### Scenario: Display selected detail next action label
- **WHEN** the selected opportunity has a current decision next action
- **THEN** the decision detail SHALL show the saved next action with a neutral `下一步 · ...` label

#### Scenario: Preserve absent next action state
- **WHEN** the selected opportunity has a current decision without a next action
- **THEN** the decision detail SHALL NOT invent or infer a next action label

#### Scenario: Keep selected detail decision evidence display-only
- **WHEN** selected detail decision evidence labels are displayed
- **THEN** the UI SHALL NOT change opportunity score, confidence, recommendation, recommendation gate, market signals, business metrics, factor contributions, persistence, reminders, alerts, scheduled actions, streaks, training grades, AI coaching, analytics, or action history
