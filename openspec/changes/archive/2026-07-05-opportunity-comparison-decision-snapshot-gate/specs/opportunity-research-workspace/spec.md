## ADDED Requirements

### Requirement: Show decision snapshot gate context in opportunity comparison
The opportunity research workspace UI SHALL show saved decision snapshot recommendation gate context in the opportunity comparison table when a current decision exists and the saved snapshot includes gate evidence.

#### Scenario: Display comparison decision snapshot gate status
- **WHEN** a compared opportunity has a current decision whose saved snapshot recommendation gate was applied, blocked, caution, or contains gate evidence
- **THEN** the comparison table decision column SHALL show the saved snapshot gate status with a neutral `快照门控` label

#### Scenario: Display comparison decision snapshot gate transition
- **WHEN** the saved decision snapshot recommendation gate was applied and contains original and final recommendations
- **THEN** the comparison table decision column SHALL show the saved recommendation transition as saved snapshot gate context

#### Scenario: Preserve comparison clear snapshot gate state
- **WHEN** a compared opportunity's saved decision snapshot recommendation gate is clear and contains no applied state, reasons, signals, or next actions
- **THEN** the comparison table decision column SHALL NOT invent, infer, generate, or backfill snapshot gate context from the current opportunity recommendation gate, score, current recommendation, missing signals, market signals, business metrics, notes, action outcomes, decision review metadata, daily action plan metadata, or render time

#### Scenario: Keep comparison decision snapshot gate display-only
- **WHEN** comparison table decision snapshot gate context is displayed
- **THEN** the UI SHALL NOT change opportunity score, confidence, recommendation, recommendation gate, market signals, business metrics, factor contributions, persistence, reminders, alerts, scheduled actions, stale filters, streaks, training grades, AI coaching, analytics, action history, or scoring input
