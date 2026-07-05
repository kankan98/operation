## ADDED Requirements

### Requirement: Fill action outcome record frame
The opportunity research workspace UI SHALL allow users to fill an empty latest action outcome input with an editable static record frame for the selected action type.

#### Scenario: Fill frame for selected action
- **WHEN** the action outcome input is empty and the user activates the record-frame fill control
- **THEN** the action outcome input SHALL be populated with an editable static frame aligned to the current selected action id

#### Scenario: Update available frame when action changes
- **WHEN** the user changes the selected action outcome type before filling a frame
- **THEN** the record-frame fill control SHALL use the newly selected action id's static frame

#### Scenario: Preserve existing manual outcome text
- **WHEN** the action outcome input already contains text
- **THEN** the record-frame fill control SHALL be unavailable and SHALL NOT overwrite the existing text

#### Scenario: Keep frame fill manual before save
- **WHEN** the record-frame fill control populates the action outcome input
- **THEN** the UI SHALL NOT automatically save the action outcome

#### Scenario: Keep record frames as manual writing support
- **WHEN** action outcome record frames are displayed or filled
- **THEN** the UI SHALL NOT treat frame headings as required fields, perform semantic validation, create reminders, alerts, scheduled actions, streaks, training grades, AI coaching, analytics, action history, scoring inputs, persistence changes, or changes to opportunity score, confidence, recommendation, recommendation gate, market signals, business metrics, or factor contributions
