# OpenSpec Spec Validation Health

## Purpose

This capability keeps the main OpenSpec specification library valid so proposal, sync, archive, and implementation workflows have a trustworthy planning source of truth.

## Requirements

### Requirement: Main specs validate cleanly
The OpenSpec main spec library SHALL validate with zero failed specs after this change is implemented.

#### Scenario: Validate all main specs
- **WHEN** `openspec validate --specs --json` is run from the repository root
- **THEN** the validation summary SHALL report zero failed specs

#### Scenario: Preserve historical requirement intent
- **WHEN** invalid historical specs are repaired
- **THEN** the changes SHALL preserve existing requirement intent unless a separate product requirement delta explicitly changes behavior

### Requirement: Repair known spec validation debt
The implementation SHALL repair the known spec validation failures that existed before this change.

#### Scenario: Repair missing required sections
- **WHEN** a spec fails because it is missing `## Purpose` or `## Requirements`
- **THEN** the spec SHALL be reformatted to include both required sections without dropping existing requirements

#### Scenario: Repair non-normative requirement text
- **WHEN** a requirement fails because it lacks SHALL or MUST language
- **THEN** the requirement SHALL be rewritten with normative SHALL or MUST wording while preserving its original meaning

#### Scenario: Track validation debt completion
- **WHEN** the implementation is complete
- **THEN** the final validation evidence SHALL include the list of previously failing specs and the passing `openspec validate --specs --json` result

### Requirement: Repair main spec warning debt
The OpenSpec main spec library SHALL have known validation warning debt repaired when a change explicitly includes validation-health cleanup.

#### Scenario: Repair short purpose warnings
- **WHEN** `openspec validate --specs --json` reports a warning that a main spec Purpose section is too brief
- **THEN** the affected Purpose section SHALL be expanded while preserving the existing capability intent

#### Scenario: Track warning-free validation evidence
- **WHEN** validation-health cleanup is complete
- **THEN** the final evidence SHALL include `openspec validate --specs --json` output showing zero failed specs and no known warning debt introduced by the cleanup

#### Scenario: Keep product behavior unchanged
- **WHEN** warning-only OpenSpec debt is repaired
- **THEN** the repair SHALL NOT change application product behavior unless a separate capability requirement explicitly requires it

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
