## ADDED Requirements

### Requirement: Fill decision evidence frame
The opportunity research workspace UI SHALL allow users to fill an empty selected opportunity decision reason with an editable static evidence frame for the current decision status.

#### Scenario: Fill frame for selected decision status
- **WHEN** the decision reason input is empty and the user activates the decision evidence frame fill control
- **THEN** the decision reason input SHALL be populated with an editable static frame aligned to the current selected decision status

#### Scenario: Update available frame when decision status changes
- **WHEN** the user changes the selected decision status before filling a frame
- **THEN** the decision evidence frame fill control SHALL use the newly selected decision status's static frame

#### Scenario: Preserve existing manual decision evidence
- **WHEN** the decision reason input already contains text
- **THEN** the decision evidence frame fill control SHALL be unavailable and SHALL NOT overwrite the existing text

#### Scenario: Keep frame fill manual before save
- **WHEN** the decision evidence frame fill control populates the decision reason input
- **THEN** the UI SHALL NOT automatically save the opportunity decision

#### Scenario: Keep decision frames as manual writing support
- **WHEN** decision evidence frames are displayed or filled
- **THEN** the UI SHALL NOT treat frame headings as required fields, perform semantic validation, create reminders, alerts, scheduled actions, stale filters, streaks, training grades, AI coaching, analytics, persistent task systems, action history, scoring inputs, persistence changes, or changes to opportunity score, confidence, recommendation, recommendation gate, market signals, business metrics, factor contributions, or decision snapshots
