## ADDED Requirements

### Requirement: Show decision reason on opportunity rows
The opportunity research workspace UI SHALL show a concise row-level summary of saved decision reasons for researched opportunities.

#### Scenario: Display saved decision reason on researched row
- **WHEN** an opportunity row has research metadata with a current decision reason
- **THEN** the row SHALL show the saved decision reason text as neutral user-authored workflow evidence

#### Scenario: Avoid inferred decision reasons
- **WHEN** an opportunity row has no current decision
- **THEN** the row SHALL NOT invent, infer, generate, or score a decision reason from opportunity score, recommendation, gates, market signals, business metrics, notes, or action outcomes

#### Scenario: Keep row decision reason display-only
- **WHEN** a row-level decision reason summary is displayed
- **THEN** the UI SHALL NOT change opportunity score, confidence, recommendation, recommendation gate, market signals, business metrics, factor contributions, persistence, reminders, alerts, scheduled actions, streaks, training grades, AI coaching, analytics, or action history
