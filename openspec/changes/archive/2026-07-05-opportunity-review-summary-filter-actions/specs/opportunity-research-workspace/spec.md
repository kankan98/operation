## ADDED Requirements

### Requirement: Apply review filters from summary cards
The opportunity research workspace UI SHALL let the user navigate from review summary cards to existing review-filtered candidate lists.

#### Scenario: Apply active research summary filter
- **WHEN** the user selects the active research summary card
- **THEN** the workspace SHALL show researched active candidates using existing review filter state without changing opportunity scoring

#### Scenario: Apply undecided summary filter
- **WHEN** the user selects the undecided summary card
- **THEN** the workspace SHALL show candidates using the existing undecided decision review filter

#### Scenario: Apply needs-action summary filter
- **WHEN** the user selects the needs-next-action summary card
- **THEN** the workspace SHALL show candidates using the existing needs-action decision review filter

#### Scenario: Apply stale summary filter
- **WHEN** the user selects the stale review summary card
- **THEN** the workspace SHALL show candidates using the existing stale decision review filter

#### Scenario: Keep review summary filters non-scoring
- **WHEN** a review summary card applies a filter
- **THEN** the UI SHALL NOT change score, confidence, recommendation, recommendation gates, market signals, business metrics, persistence, automation, reminders, alerts, scheduled actions, stale thresholds, streaks, training grades, AI coaching, analytics, historical tasks, or scoring inputs

#### Scenario: Clear detached action context
- **WHEN** a review summary card applies a filter after a daily action or practice bucket selected transient action context
- **THEN** the UI SHALL clear that transient action context instead of carrying it into the newly filtered candidate set
