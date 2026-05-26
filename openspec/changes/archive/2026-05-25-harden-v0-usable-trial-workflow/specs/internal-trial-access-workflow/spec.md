## ADDED Requirements

### Requirement: Internal trial cockpit shows dynamic V0 progress
The internal trial overview cockpit SHALL show dynamic V0 workflow progress
after the evaluator's trial session is verified.

#### Scenario: Cockpit progress is ready
- **WHEN** the overview verifies the trial session and the protected list checks
  succeed
- **THEN** the cockpit SHALL show each implemented V0 workbench with a safe
  started or empty state, count summary, and direct link

#### Scenario: Cockpit progress is loading
- **WHEN** the overview is checking the verified trial workflow progress
- **THEN** the cockpit SHALL show a visible loading state and SHALL NOT claim
  that protected workbench data has loaded

#### Scenario: Cockpit progress is retryable
- **WHEN** workflow progress loading fails
- **THEN** the cockpit SHALL keep the trial access controls available and SHALL
  offer a safe retry or refresh action without exposing implementation details

#### Scenario: Cockpit next action is available
- **WHEN** the readiness model identifies a next useful workbench
- **THEN** the cockpit SHALL offer a primary continuation action to that
  workbench while preserving direct access to the other implemented V0
  workbenches
