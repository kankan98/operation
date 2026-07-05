## ADDED Requirements

### Requirement: Show decision snapshot evidence in opportunity comparison
The opportunity research workspace UI SHALL show saved decision snapshot reasons and gaps in the opportunity comparison table when a current decision exists and the saved snapshot contains evidence.

#### Scenario: Display comparison decision snapshot reasons
- **WHEN** a compared opportunity has a current decision whose saved snapshot contains one or more `keyReasons`
- **THEN** the comparison table decision column SHALL show saved snapshot reasons with a neutral `快照依据 · ...` label

#### Scenario: Display comparison decision snapshot gaps
- **WHEN** a compared opportunity has a current decision whose saved snapshot contains one or more `missingSignals`
- **THEN** the comparison table decision column SHALL show saved snapshot gaps with a neutral `快照缺口 · ...` label

#### Scenario: Preserve comparison snapshot evidence source
- **WHEN** saved decision snapshot reasons or gaps differ from current opportunity key reasons, current missing signals, score factors, recommendation gates, market signals, business metrics, notes, action outcomes, decision review metadata, daily action plan metadata, or render time
- **THEN** the comparison table decision column SHALL use only the saved decision snapshot `keyReasons` and `missingSignals` for `快照依据` and `快照缺口`

#### Scenario: Avoid inferred comparison snapshot evidence
- **WHEN** a compared opportunity has no current decision or its saved snapshot evidence arrays are empty
- **THEN** the comparison table decision column SHALL NOT invent, infer, generate, or backfill snapshot reasons or gaps from current opportunity key reasons, current missing signals, score factors, recommendation gates, market signals, business metrics, notes, action outcomes, decision review metadata, daily action plan metadata, or render time

#### Scenario: Keep comparison decision snapshot evidence display-only
- **WHEN** comparison table decision snapshot evidence is displayed
- **THEN** the UI SHALL NOT change opportunity score, confidence, recommendation, recommendation gate, market signals, business metrics, factor contributions, persistence, reminders, alerts, scheduled actions, stale filters, streaks, training grades, AI coaching, analytics, action history, or scoring input
