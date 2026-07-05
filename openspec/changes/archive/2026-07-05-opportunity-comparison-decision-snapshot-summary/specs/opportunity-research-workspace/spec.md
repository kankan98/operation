## ADDED Requirements

### Requirement: Show decision snapshot summary in opportunity comparison
The opportunity research workspace UI SHALL show saved decision snapshot score and recommendation evidence in the opportunity comparison table when a current decision exists.

#### Scenario: Display comparison decision snapshot summary
- **WHEN** a compared opportunity has research metadata with a current decision and saved decision snapshot
- **THEN** the comparison table decision column SHALL show the saved snapshot score and recommendation with a neutral snapshot label

#### Scenario: Preserve comparison snapshot source
- **WHEN** the saved decision snapshot score or recommendation differs from the current opportunity score or recommendation
- **THEN** the comparison table decision column SHALL use the saved decision snapshot score and recommendation for the snapshot display

#### Scenario: Avoid inferred comparison snapshot summary
- **WHEN** a compared opportunity has no current decision
- **THEN** the comparison table decision column SHALL NOT invent, infer, generate, or backfill a decision snapshot summary from current score, current recommendation, gates, market signals, business metrics, notes, action outcomes, review metadata, daily action plan metadata, or render time

#### Scenario: Keep comparison decision snapshot display-only
- **WHEN** a comparison table decision snapshot summary is displayed
- **THEN** the UI SHALL NOT change opportunity score, confidence, recommendation, recommendation gate, market signals, business metrics, factor contributions, persistence, reminders, alerts, scheduled actions, streaks, training grades, AI coaching, analytics, action history, or scoring input
