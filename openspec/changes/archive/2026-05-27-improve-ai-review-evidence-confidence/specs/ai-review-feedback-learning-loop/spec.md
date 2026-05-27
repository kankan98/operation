## ADDED Requirements

### Requirement: AI review feedback signals inform visible trust guidance
The AI review feedback learning loop SHALL use existing feedback signals to
inform visible trust guidance for the selected run without automatically
changing authoritative knowledge, prompt versions, source trust, or downstream
artifacts.

#### Scenario: Feedback identifies a trust hotspot
- **WHEN** selected-run feedback includes missing-knowledge, wrong-source, or
  evidence-weak signals
- **THEN** the `/ai-review` workbench SHALL surface the hotspot in the evidence
  confidence panel and section cards as a review or evaluation routing signal

#### Scenario: Feedback remains review-only
- **WHEN** feedback signals are used to explain evidence confidence
- **THEN** the system SHALL NOT publish knowledge, revise racket facts, change
  source trust, alter prompt versions, publish talk tracks, or complete tasks
  automatically

#### Scenario: No feedback exists yet
- **WHEN** a selected AI review run has no feedback signals
- **THEN** the evidence confidence panel SHALL show that feedback is not yet
  available and SHALL direct the operator to review generated sections before
  downstream reuse
