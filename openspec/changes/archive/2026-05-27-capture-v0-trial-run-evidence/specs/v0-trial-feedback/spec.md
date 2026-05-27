## ADDED Requirements

### Requirement: V0 trial feedback can link to trial run evidence
The V0 trial feedback workflow SHALL allow feedback to be associated with an
optional scoped trial run and trial run step without requiring every feedback
record to be linked.

#### Scenario: Feedback is submitted for a run step
- **WHEN** a verified evaluator submits feedback from a guided trial run step
- **THEN** the system SHALL store the feedback with the associated trial run and
  step identifiers after verifying that both belong to the current actor,
  tenant, and team scope

#### Scenario: Loose feedback remains supported
- **WHEN** a verified evaluator submits feedback without a trial run or step
  identifier
- **THEN** the system SHALL continue to persist the scoped feedback as a loose
  feedback record and SHALL NOT require trial run evidence for the existing
  feedback workflow

#### Scenario: Cross-scope trial run link is rejected
- **WHEN** a feedback submission references a trial run or step from another
  tenant, team, or actor scope
- **THEN** the system SHALL reject the request with a safe operator-facing
  message and SHALL NOT create the feedback record

### Requirement: V0 trial feedback summary distinguishes complete-path evidence
The V0 trial feedback evidence summary SHALL distinguish feedback linked to
complete trial runs from loose notes where scoped run evidence is available.

#### Scenario: Linked complete-run feedback exists
- **WHEN** scoped feedback includes records linked to completed trial runs
- **THEN** the evidence summary SHALL expose safe counts or labels that indicate
  complete-path feedback exists without leaking raw protected run metadata

#### Scenario: Only loose feedback exists
- **WHEN** scoped feedback exists but none is linked to a completed trial run
- **THEN** the evidence summary SHALL keep the existing feedback metrics and
  SHALL recommend collecting guided trial run evidence before broad V0/V1
  prioritization

#### Scenario: Feedback safety boundaries are preserved
- **WHEN** feedback is linked to run evidence or summarized with run evidence
- **THEN** the workflow SHALL NOT render raw cookies, session references,
  database URLs, provider configuration, API keys, authorization headers, stack
  traces, raw transcripts, raw prompts, or cross-team feedback
