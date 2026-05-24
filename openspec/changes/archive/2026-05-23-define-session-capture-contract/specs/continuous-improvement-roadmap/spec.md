## ADDED Requirements

### Requirement: Session capture contract precedes session persistence
The autonomous development roadmap SHALL treat the session capture contract as
a prerequisite for future live-session draft saving, transcript import,
structured question capture, AI review input, and next-action handoff.

#### Scenario: Session capture implementation is selected
- **WHEN** a future roadmap wave selects session persistence, autosave,
  transcript import, customer-question structuring, AI review input, or task
  handoff
- **THEN** the wave starts from the session capture contract and updates it if
  schema, API, authorization, input limits, state, or verification assumptions
  change
