## ADDED Requirements

### Requirement: Internal trial overview acts as MVP cockpit
The internal trial overview SHALL act as a compact MVP cockpit that helps
evaluators understand the verified demo team state, current workflow step, and
available implemented workbenches.

#### Scenario: MVP cockpit is ready
- **WHEN** the internal trial session is verified
- **THEN** the overview SHALL show the demo team, actor display name, recommended
  workflow sequence, route availability for all implemented V0 workbenches, and
  direct actions to continue the trial path

#### Scenario: MVP cockpit needs re-entry
- **WHEN** the stored display scope is missing, stale, logged out, or rejected
  by the safe session route
- **THEN** the overview SHALL show a re-enter trial action and SHALL NOT claim
  that protected V0 data or team context is ready

#### Scenario: Workbench route is selected from cockpit
- **WHEN** an evaluator opens any implemented workbench from the cockpit
- **THEN** the target workbench SHALL still verify the app-owned session cookie,
  explicit tenant/team scope, permissions, CSRF requirements for mutations, and
  repository ownership before loading or mutating protected data

### Requirement: Internal trial recovery avoids implementation detail
The internal trial workflow SHALL present recoverable failures in operator-facing
language that supports the next useful action.

#### Scenario: Session verification fails
- **WHEN** the safe session route rejects or cannot verify the current trial
  scope
- **THEN** the UI SHALL offer refresh, logout, or re-enter actions and SHALL NOT
  render raw cookies, opaque session references, database URLs, CSRF tokens,
  provider config, stack traces, or raw protected records

#### Scenario: Workbench route fails to load
- **WHEN** a workbench cannot load due to auth, scope, route, network, or data
  readiness failure
- **THEN** the UI SHALL keep the trial status inspectable and offer a safe return
  or retry path instead of leaving the evaluator on an empty or frozen view
