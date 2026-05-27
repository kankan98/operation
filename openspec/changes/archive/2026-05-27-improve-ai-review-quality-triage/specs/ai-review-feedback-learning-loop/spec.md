## ADDED Requirements

### Requirement: AI review feedback signals drive quality repair triage
The AI review feedback learning loop SHALL use existing operator feedback signals to inform quality repair triage for the selected run without treating feedback as authoritative knowledge or automatic prompt changes.

#### Scenario: Feedback creates quality repair signal
- **WHEN** an operator records missing-knowledge, wrong-source, evidence-weak, rejected, regenerated, accepted, edited, or downstream-used feedback
- **THEN** the selected run quality triage SHALL reflect the signal as review routing, repair priority, or downstream evidence according to the signal type

#### Scenario: Knowledge feedback remains review-only
- **WHEN** missing-knowledge or wrong-source feedback affects quality triage
- **THEN** the system SHALL route the issue toward knowledge or source review and SHALL NOT modify published knowledge, source trust, racket facts, prompt versions, or downstream artifacts automatically

#### Scenario: Downstream feedback informs confidence
- **WHEN** downstream-used feedback exists for an accepted section
- **THEN** quality triage SHALL treat it as evaluation evidence and SHALL NOT imply that the downstream draft has been published or the next-session task has been completed
