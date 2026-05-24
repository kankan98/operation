# next-actions-workbench Specification

## Purpose
TBD - created by archiving change implement-v0-downstream-artifact-workflow. Update Purpose after archive.
## Requirements
### Requirement: Next-actions route shows a browser task workbench
The `/next-actions` route SHALL render a browser workbench that can operate in the authenticated local V0 team context and connect accepted AI review sections or manual operator input to protected next-session task creation, listing, and progress actions.

#### Scenario: Operator opens next-actions route
- **WHEN** an operator opens `/next-actions`
- **THEN** the page shows Chinese sections for V0 team entry, task list, source selection, task creation, checklist/progress, feedback state, loading, empty, error, disabled, and success states

#### Scenario: Scoped tasks are listed
- **WHEN** the operator has a valid local V0 auth session and team scope
- **THEN** the page SHALL load scoped next-session tasks through the protected list route and show title, priority, status, owner, source, due policy, checklist state, and updated time without cross-team data

#### Scenario: Empty state is actionable
- **WHEN** scoped next-session tasks are empty
- **THEN** the page SHALL show a concise empty state that directs the operator to create a task from an accepted AI review section or manual follow-up input

### Requirement: Next-actions workbench creates source-linked tasks
The `/next-actions` workbench SHALL let an authenticated V0 operator create source-linked next-session tasks through existing protected Route Handlers.

#### Scenario: Create task from accepted AI review section
- **WHEN** the operator selects an accepted AI review section eligible for next-session follow-up and saves a task
- **THEN** the browser SHALL call the next-session task create route with explicit tenant/team scope, the required mutation CSRF header, source workflow, run ID, section ID, source readiness, task type, priority, owner where available, and checklist items

#### Scenario: Create manual task
- **WHEN** the operator enters a manual task title and summary without an AI review source
- **THEN** the browser SHALL save a manual source-linked task through the protected next-session task create route and label the source as manual/team input

#### Scenario: Duplicate or unsafe source is not silently saved
- **WHEN** the protected task create route rejects a duplicate, unsafe source, invalid assignee, or invalid state
- **THEN** the page SHALL show the safe route message and SHALL NOT claim the task was created

### Requirement: Next-actions workbench supports basic task progress
The `/next-actions` workbench SHALL let the authenticated V0 operator perform basic progress actions that are already supported by the task API.

#### Scenario: Operator starts an assigned task
- **WHEN** an assigned task is visible in the task list and the operator starts it
- **THEN** the browser SHALL call the protected status route with the current from-status and update the displayed task state after success

#### Scenario: Operator marks checklist progress
- **WHEN** a task has checklist items and the operator marks an item done or blocked
- **THEN** the browser SHALL call the protected checklist route and update the displayed task after success

#### Scenario: Completion gate is visible
- **WHEN** required checklist or dependency gates prevent completion
- **THEN** the page SHALL show a concise blocker message and SHALL NOT hide the source or audit context

### Requirement: Next-actions workbench remains usable on mobile and desktop
The `/next-actions` workbench SHALL remain readable and operable across desktop and mobile viewports.

#### Scenario: Mobile layout has no horizontal overflow
- **WHEN** `/next-actions` renders at a 390px-wide viewport
- **THEN** task lists, progress controls, checklist items, source chips, and action buttons SHALL fit without horizontal page overflow or text overlap

#### Scenario: Errors are safe and actionable
- **WHEN** a protected next-action request fails
- **THEN** the page SHALL show concise Chinese recovery text without exposing raw cookies, auth references, database URLs, prompts, provider payloads, raw customer messages, or protected cross-team data
