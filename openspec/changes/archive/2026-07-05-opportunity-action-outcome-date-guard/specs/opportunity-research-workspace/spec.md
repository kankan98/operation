## ADDED Requirements

### Requirement: Guard action outcome completion dates
The opportunity research workspace SHALL prevent future completion dates from being saved as latest daily action outcome evidence.

#### Scenario: Reject future action outcome completion timestamp
- **WHEN** a client records an action outcome with `completedAt` later than the current server time
- **THEN** the system SHALL reject the request with validation feedback instead of storing the future-dated outcome

#### Scenario: Allow present and past action outcome completion dates
- **WHEN** a client records an action outcome with `completedAt` at or before the current server time
- **THEN** the system SHALL accept the completion timestamp if the rest of the request is valid

#### Scenario: Prevent future completion date selection in workspace UI
- **WHEN** the user records an action outcome from the opportunity workspace
- **THEN** the completion date control SHALL prevent dates after the user's current local date and SHALL NOT submit future-dated completion evidence

#### Scenario: Keep date guard scoped to workflow evidence
- **WHEN** a future completion date is blocked
- **THEN** the system SHALL NOT create reminders, scheduled actions, streaks, training grades, AI coaching, or scoring changes from the blocked date
