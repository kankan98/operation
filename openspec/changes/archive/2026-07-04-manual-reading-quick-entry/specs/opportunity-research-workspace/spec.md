## ADDED Requirements

### Requirement: Record manual reading from opportunity workspace
The opportunity research workspace SHALL allow users to record a manual price reading for the selected candidate while preserving the current comparison and filtering context.

#### Scenario: Open quick reading dialog from selected opportunity
- **WHEN** a user is reviewing a selected opportunity candidate
- **THEN** the workspace SHALL expose a record-reading action that opens a dialog scoped to that candidate's product

#### Scenario: Save manual reading from opportunity workspace
- **WHEN** the user submits a valid reading from the opportunity workspace
- **THEN** the frontend SHALL create a price snapshot with `source: 'manual'`, the selected product currency, and the entered fields

#### Scenario: Refresh opportunity context after manual reading
- **WHEN** the manual reading is saved successfully
- **THEN** the opportunity list and selected candidate detail SHALL refresh so score, recommendation, missing-signal context, current price, and freshness indicators can reflect the new data

#### Scenario: Keep manual entry distinct from provider acquisition
- **WHEN** the workspace recommends `check_data` or shows missing signals
- **THEN** the manual reading action SHALL be available as a user-entered data path and SHALL NOT be presented as an automated provider check
