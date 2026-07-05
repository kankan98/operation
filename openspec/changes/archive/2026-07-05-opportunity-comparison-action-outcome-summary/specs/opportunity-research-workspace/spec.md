## ADDED Requirements

### Requirement: Show latest action outcome in opportunity comparison
The opportunity research workspace UI SHALL show saved latest action outcome evidence in the opportunity comparison table when it exists.

#### Scenario: Display comparison latest action outcome
- **WHEN** a compared opportunity has research metadata with a saved `lastActionOutcome`
- **THEN** the comparison table SHALL show the saved action label, completion recency, and outcome text as neutral workflow practice evidence

#### Scenario: Preserve missing comparison outcome state
- **WHEN** a compared opportunity has no research metadata or has no saved `lastActionOutcome`
- **THEN** the comparison table SHALL NOT invent, infer, generate, or backfill an action outcome from notes, decisions, decision review metadata, daily action plan metadata, practice summary counts, score, recommendation, recommendation gates, market signals, or business metrics

#### Scenario: Keep comparison action outcome display-only
- **WHEN** a comparison table latest action outcome is displayed
- **THEN** the UI SHALL NOT change opportunity score, confidence, recommendation, recommendation gate, market signals, business metrics, factor contributions, persistence, reminders, alerts, scheduled actions, streaks, training grades, AI coaching, analytics, action history, or scoring input
