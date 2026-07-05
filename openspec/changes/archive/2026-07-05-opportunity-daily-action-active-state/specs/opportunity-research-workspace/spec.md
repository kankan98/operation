## ADDED Requirements

### Requirement: Expose daily action plan active state
The opportunity research workspace UI SHALL expose a display-only active state for daily action plan items when the current UI state exactly represents the selected daily action queue.

#### Scenario: Mark selected daily action item active
- **WHEN** the user selects a daily action plan item and the current UI filters exactly match that item
- **THEN** that daily action item SHALL show visual active state and expose `aria-pressed=true`

#### Scenario: Keep inactive daily action items unpressed
- **WHEN** a daily action item does not match the current selected daily action context and exact UI filters
- **THEN** that daily action item SHALL expose `aria-pressed=false`

#### Scenario: Avoid active state for narrowed daily action views
- **WHEN** extra discovery, research, review, practice, shortlist, operations, or decision-status filters narrow a daily action view beyond the selected action item's filters
- **THEN** daily action plan items SHALL NOT claim active state for that narrowed view

#### Scenario: Keep daily action active state display-only
- **WHEN** daily action active state is displayed
- **THEN** it SHALL NOT change opportunity score, confidence, recommendation, recommendation gate, market signals, business metrics, factor contributions, action plan counts, persisted research state, reminders, alerts, schedules, analytics, or training grades
