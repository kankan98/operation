## ADDED Requirements

### Requirement: Expose decision review metadata
The opportunity research workspace SHALL expose derived decision review metadata for each research entry without changing opportunity scoring.

#### Scenario: Decision with next action
- **WHEN** a research entry has a current decision with a next action
- **THEN** the response SHALL include review metadata indicating the decision exists, its status, decided timestamp, days since decision, and that a next action is present

#### Scenario: Go or hold decision missing next action
- **WHEN** a `go` or `hold` decision has no next action
- **THEN** the response SHALL mark the decision as needing a next action

#### Scenario: Stale decision
- **WHEN** a decision is older than the configured review threshold
- **THEN** the response SHALL mark the decision as stale so the user can revisit the judgment

#### Scenario: Review metadata stays non-scoring
- **WHEN** decision review metadata changes because time has passed or a next action is edited
- **THEN** opportunity score, confidence, recommendation, recommendation gate, and factor contributions SHALL NOT change because of review metadata

### Requirement: Filter opportunities for decision review
The opportunity research workspace SHALL let clients filter opportunity lists by decision review state.

#### Scenario: Filter by decision status
- **WHEN** a client requests opportunities with a decision status filter
- **THEN** the list SHALL include only opportunities whose current decision has that status

#### Scenario: Filter decisions needing action
- **WHEN** a client requests opportunities needing decision action
- **THEN** the list SHALL include only decided opportunities whose review metadata indicates a missing next action

#### Scenario: Filter stale decisions
- **WHEN** a client requests stale decisions
- **THEN** the list SHALL include only decided opportunities whose decision age meets or exceeds the review threshold

#### Scenario: Filter undecided opportunities
- **WHEN** a client requests undecided opportunities
- **THEN** the list SHALL include only opportunities that do not have a current decision trace

### Requirement: Surface decision review in opportunity workspace UI
The opportunity research workspace UI SHALL provide a review mode for decision follow-up without replacing the score discovery workflow.

#### Scenario: Switch to decision review mode
- **WHEN** the user chooses decision review mode
- **THEN** the workspace SHALL expose decision review filters and show counts based on the filtered opportunity list

#### Scenario: Show review badges on opportunities
- **WHEN** an opportunity has a decision review state such as stale or needs action
- **THEN** the opportunity row and selected detail SHALL show a concise badge or summary of that state

#### Scenario: Keep decision controls explicit
- **WHEN** the user edits or clears a decision from the review mode
- **THEN** the UI SHALL continue to use the explicit decision form and SHALL NOT silently change decisions or score inputs
