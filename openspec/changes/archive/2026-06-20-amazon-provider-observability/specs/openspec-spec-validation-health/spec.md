## ADDED Requirements

### Requirement: Gate Amazon observability completion on OpenSpec validation
The implementation SHALL keep both the Amazon provider observability change and the OpenSpec main spec library validating cleanly before the change is considered complete.

#### Scenario: Validate the active change
- **WHEN** implementation work for `amazon-provider-observability` is complete
- **THEN** `openspec validate --changes amazon-provider-observability --json` SHALL report zero failed items

#### Scenario: Validate the main spec library
- **WHEN** implementation work for `amazon-provider-observability` is complete
- **THEN** `openspec validate --specs --json` SHALL report zero failed main specs

#### Scenario: Repair newly discovered debt
- **WHEN** either validation command reports OpenSpec debt introduced or exposed during this change
- **THEN** the debt SHALL be repaired in the affected OpenSpec artifacts before completion unless it is explicitly split into a separate approved change

### Requirement: Record OpenSpec validation evidence for provider observability
The implementation SHALL record concise validation evidence for the Amazon provider observability change.

#### Scenario: Evidence includes command results
- **WHEN** final implementation notes or task completion evidence are prepared
- **THEN** they SHALL include the executed OpenSpec validation commands and whether they passed

#### Scenario: Evidence distinguishes existing clean state
- **WHEN** the main spec library already validates cleanly before implementation
- **THEN** the evidence SHALL state that the work preserved zero failed specs rather than claiming unrelated repair work
