## ADDED Requirements

### Requirement: AI review run persistence accepts generation handoff data
The AI review run persistence slice SHALL remain separate from prompt
orchestration while allowing validated AI review generation results to be
recorded through existing provider invocation, output, validation, and
review-ready repository methods.

#### Scenario: Generation succeeds before persistence handoff
- **WHEN** a future workflow receives a successful generation result from the
  orchestrator
- **THEN** it can record safe provider metadata, structured output sections, and
  validation results through existing repository methods without storing full
  prompts, full provider payloads, raw transcripts, customer personal data, or
  secrets

#### Scenario: Generation validation blocks output
- **WHEN** the orchestrator returns blocking validation results
- **THEN** the future workflow MUST record validation failure or keep the run
  non-review-ready instead of marking suggestions as reviewable or creating
  downstream artifacts

#### Scenario: Generation fails before provider success
- **WHEN** the orchestrator fails because input, evidence, provider, schema, or
  policy checks fail
- **THEN** the future workflow may record safe provider or validation metadata
  according to the failure category but MUST NOT persist partial AI output as
  usable review suggestions
