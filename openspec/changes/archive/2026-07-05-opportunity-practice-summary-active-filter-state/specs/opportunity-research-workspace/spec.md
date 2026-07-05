## ADDED Requirements

### Requirement: Show active practice summary filter state
The opportunity research workspace UI SHALL show which practice summary control matches the current practice coverage filter.

#### Scenario: Display active action-outcome coverage control
- **WHEN** the current opportunity workspace filter state matches a practice summary action-outcome coverage filter
- **THEN** that practice summary control SHALL show visual active state and expose `aria-pressed=true`

#### Scenario: Display active action bucket control
- **WHEN** the current opportunity workspace filter state matches a practice summary action bucket filter
- **THEN** that action bucket control SHALL show visual active state and expose `aria-pressed=true`

#### Scenario: Keep inactive practice summary controls unpressed
- **WHEN** a practice summary control does not match the current opportunity workspace filter state
- **THEN** that control SHALL expose `aria-pressed=false`

#### Scenario: Avoid active state for narrowed practice views
- **WHEN** additional discovery, research, review, shortlist, or operational filters narrow the candidate list beyond the practice summary control's filter
- **THEN** the practice summary controls SHALL NOT claim active state for that narrowed view

#### Scenario: Keep practice active state display-only
- **WHEN** practice summary active state is displayed
- **THEN** the UI SHALL NOT change score, confidence, recommendation, recommendation gates, market signals, business metrics, persistence, automation, reminders, alerts, scheduled actions, stale thresholds, streaks, training grades, AI coaching, analytics, historical tasks, or scoring inputs
