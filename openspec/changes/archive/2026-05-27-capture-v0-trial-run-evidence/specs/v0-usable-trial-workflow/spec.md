## ADDED Requirements

### Requirement: V0.9 readiness uses trial run evidence
The V0.9 trial readiness cockpit SHALL incorporate scoped trial run evidence in
addition to protected workbench counts and scoped feedback evidence.

#### Scenario: No complete trial run exists
- **WHEN** a verified evaluator has no completed scoped trial run evidence
- **THEN** the readiness cockpit SHALL recommend starting or resuming a guided
  trial run and SHALL NOT claim that V0.9 has complete internal trial evidence

#### Scenario: Trial run has pending steps
- **WHEN** the latest scoped trial run has pending steps
- **THEN** the readiness cockpit SHALL show the next pending step as the
  immediate trial action before broad V0/V1 prioritization

#### Scenario: Trial run includes blockers
- **WHEN** scoped trial run evidence includes issue or skipped steps
- **THEN** the readiness cockpit SHALL surface the blocker step and SHALL keep
  the stage in fix-blockers or collect-evidence instead of production-gate
  preparation

#### Scenario: Trial run is complete
- **WHEN** a scoped trial run has all six steps completed and no issue or
  skipped blockers
- **THEN** the readiness cockpit MAY use that run as complete internal trial
  evidence while still requiring scoped feedback evidence and production gates
  before any production readiness claim

### Requirement: Trial checklist reflects run status
The V0.9 trial checklist SHALL show run step status when scoped trial run
evidence is available.

#### Scenario: Checklist has run evidence
- **WHEN** a verified evaluator has an active or recent scoped trial run
- **THEN** each checklist row SHALL show whether its step is pending, passed,
  issue, or skipped and SHALL keep the step's task, evidence, and feedback focus
  visible

#### Scenario: Checklist has no run evidence
- **WHEN** no scoped trial run exists
- **THEN** the checklist SHALL keep the existing task guidance and SHALL prompt
  the evaluator to start a run before treating the checklist as completed

#### Scenario: Checklist remains bounded
- **WHEN** run status is shown in the checklist
- **THEN** the cockpit SHALL remain operator-facing, concise, responsive, and
  free of marketing-style hero content or decorative charts
