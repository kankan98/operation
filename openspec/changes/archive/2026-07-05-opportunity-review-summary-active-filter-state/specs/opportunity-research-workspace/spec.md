## ADDED Requirements

### Requirement: Show active review summary filter state
The opportunity research workspace UI SHALL show which review summary card matches the current review-summary queue filter.

#### Scenario: Display active review summary card
- **WHEN** the current opportunity workspace filter state matches a review summary card's existing queue filter
- **THEN** that card SHALL show visual active state and expose `aria-pressed=true`

#### Scenario: Keep inactive review summary cards unpressed
- **WHEN** a review summary card does not match the current opportunity workspace filter state
- **THEN** that card SHALL expose `aria-pressed=false`

#### Scenario: Avoid active state for narrowed views
- **WHEN** additional discovery, research, decision-status, or practice filters narrow the candidate list beyond the review summary card's queue filter
- **THEN** the review summary cards SHALL NOT claim active state for that narrowed view

#### Scenario: Keep active state display-only
- **WHEN** review summary active state is displayed
- **THEN** the UI SHALL NOT change score, confidence, recommendation, recommendation gates, market signals, business metrics, persistence, automation, reminders, alerts, scheduled actions, stale thresholds, streaks, training grades, AI coaching, analytics, historical tasks, or scoring inputs
