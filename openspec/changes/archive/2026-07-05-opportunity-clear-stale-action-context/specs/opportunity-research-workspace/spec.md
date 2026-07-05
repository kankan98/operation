## ADDED Requirements

### Requirement: Clear stale action context after manual filter edits
The opportunity research workspace UI SHALL clear transient workflow action context when manual navigation or filter changes can detach the selected candidate set from the previously selected daily action or practice bucket.

#### Scenario: Clear daily action context after manual filter edit
- **WHEN** a daily action selection has set transient action context and the user manually changes workspace mode, list sorting, shortlist-only, discovery filters, research filters, or review filters
- **THEN** the UI SHALL clear the transient action context so a candidate without saved latest outcome falls back to the default action outcome type

#### Scenario: Preserve explicit action context selections
- **WHEN** the user selects a daily action plan item or a practice action bucket
- **THEN** the UI SHALL continue to set transient action context for that explicit workflow action selection

#### Scenario: Preserve saved outcome priority
- **WHEN** the selected candidate already has a saved latest action outcome
- **THEN** the action outcome form SHALL continue to show the saved action id and outcome text instead of using or clearing transient context as the source of truth

#### Scenario: Keep context clearing non-scoring
- **WHEN** transient action context is cleared
- **THEN** the UI SHALL NOT change opportunity score, confidence, recommendation, recommendation gate, market signals, business metrics, factor contributions, persistence, reminders, alerts, streaks, training grades, AI coaching, analytics, or action history
