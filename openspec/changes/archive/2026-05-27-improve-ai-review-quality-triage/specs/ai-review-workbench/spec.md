## ADDED Requirements

### Requirement: AI review workbench shows quality triage for the selected run
The `/ai-review` workbench SHALL show a compact quality triage panel for the selected AI review run, using existing safe run detail fields and deterministic triage logic.

#### Scenario: Generated run has quality blockers
- **WHEN** a selected generated run has validation blockers, feedback hotspots, weak evidence, missing sources, or pending human review
- **THEN** the workbench SHALL show the highest-priority quality card, repair route, affected section count, and concise next action in Chinese operator-facing copy

#### Scenario: Generated run is downstream-ready
- **WHEN** a selected generated run has accepted or edited downstream-capable sections with no higher-priority quality blocker
- **THEN** the workbench SHALL show that downstream draft creation is available while keeping publication and task completion review-gated

#### Scenario: Prepared run has no output
- **WHEN** a selected run is prepared but has no generated sections
- **THEN** the workbench SHALL show that quality triage is waiting for generated suggestions instead of showing a misleading score

### Requirement: AI review section cards show repair reasons
Generated section cards in `/ai-review` SHALL show concise quality repair reasons derived from section-level triage.

#### Scenario: Section has repair reasons
- **WHEN** a generated section has missing source, low confidence, wrong-source feedback, missing-knowledge feedback, evidence-weak feedback, validation warning, or pending human review
- **THEN** the section card SHALL show compact repair labels and an operator-facing repair instruction before downstream action controls

#### Scenario: Section can create downstream draft
- **WHEN** a generated section maps to a supported downstream artifact and is accepted or edited without higher-priority repair issues
- **THEN** the section card SHALL keep the downstream draft action visible and label it as draft creation rather than publication or task completion

### Requirement: AI review quality triage remains usable on desktop and mobile
The quality triage panel and section repair guidance SHALL fit the existing operational workbench layout on desktop and mobile viewports.

#### Scenario: Responsive triage layout
- **WHEN** `/ai-review` renders with quality triage on desktop and mobile viewport sizes
- **THEN** labels, counts, guidance text, badges, and review controls SHALL remain readable without horizontal overflow, incoherent overlap, or unstable control resizing

#### Scenario: Error and pending states are accessible
- **WHEN** triage-related actions, review actions, or feedback actions are pending or fail
- **THEN** the workbench SHALL preserve existing loading or alert states and SHALL avoid relying on color alone to communicate quality state
