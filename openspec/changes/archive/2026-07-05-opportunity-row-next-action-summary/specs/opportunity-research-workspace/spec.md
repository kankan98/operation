## ADDED Requirements

### Requirement: Show decision next action on opportunity rows
The opportunity research workspace UI SHALL show a concise row-level summary of saved decision next actions for researched opportunities.

#### Scenario: Display saved next action on researched row
- **WHEN** an opportunity row has research metadata with a current decision that includes `nextAction`
- **THEN** the row SHALL show the saved next action text as neutral workflow follow-up metadata

#### Scenario: Preserve missing next action badge behavior
- **WHEN** an opportunity row has a current decision without `nextAction`
- **THEN** the row SHALL continue to rely on existing decision review metadata and SHALL NOT invent or infer a next action summary

#### Scenario: Keep row next action display-only
- **WHEN** a row-level next action summary is displayed
- **THEN** the UI SHALL NOT change opportunity score, confidence, recommendation, recommendation gate, market signals, business metrics, factor contributions, persistence, reminders, alerts, scheduled actions, streaks, training grades, AI coaching, analytics, or action history
