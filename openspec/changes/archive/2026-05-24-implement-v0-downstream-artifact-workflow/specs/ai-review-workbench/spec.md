## ADDED Requirements

### Requirement: AI review workbench can start downstream draft creation
The `/ai-review` workbench SHALL help operators continue from accepted suggestions into downstream work without turning AI output into authoritative facts.

#### Scenario: Accepted section shows downstream next step
- **WHEN** an AI review run has accepted or edited sections eligible for downstream use
- **THEN** each eligible section SHALL show a concise downstream action and link target that explains whether it can become a talk-track draft, short-video hook draft, or next-session task

#### Scenario: Downstream action calls protected AI review route
- **WHEN** the operator starts downstream creation from `/ai-review`
- **THEN** the browser SHALL call the protected AI review downstream artifact route with explicit tenant/team scope and the AI review mutation CSRF header before directing the operator to the downstream workbench

#### Scenario: AI output remains reviewable
- **WHEN** downstream actions are visible on `/ai-review`
- **THEN** the UI SHALL still distinguish human-entered session facts, AI suggestions, validation results, and draft downstream artifacts, and SHALL NOT imply automatic publication or completion
