## ADDED Requirements

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
