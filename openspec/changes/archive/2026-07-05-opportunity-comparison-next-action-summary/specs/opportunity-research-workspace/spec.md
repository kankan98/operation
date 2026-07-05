## ADDED Requirements

### Requirement: Show decision next action in opportunity comparison
The opportunity research workspace UI SHALL show saved decision next action evidence in the opportunity comparison table when it exists.

#### Scenario: Display comparison decision next action
- **WHEN** a compared opportunity has research metadata with a current decision that includes `nextAction`
- **THEN** the comparison table decision column SHALL show the saved next action with a neutral `下一步 · ...` label

#### Scenario: Preserve missing comparison next action state
- **WHEN** a compared opportunity has no current decision or its current decision has no `nextAction`
- **THEN** the comparison table decision column SHALL NOT invent, infer, generate, or backfill a next action from score, recommendation, recommendation gates, market signals, business metrics, notes, action outcomes, review metadata, or daily action plan metadata

#### Scenario: Keep comparison next action display-only
- **WHEN** a comparison table decision next action is displayed
- **THEN** the UI SHALL NOT change opportunity score, confidence, recommendation, recommendation gate, market signals, business metrics, factor contributions, persistence, reminders, alerts, scheduled actions, streaks, training grades, AI coaching, analytics, action history, or scoring input
