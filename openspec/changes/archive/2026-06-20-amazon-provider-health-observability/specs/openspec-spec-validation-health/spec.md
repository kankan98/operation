## ADDED Requirements

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
