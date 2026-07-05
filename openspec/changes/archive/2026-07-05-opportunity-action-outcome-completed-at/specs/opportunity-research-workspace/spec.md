## ADDED Requirements

### Requirement: Set action outcome completion date in opportunity workspace UI
The opportunity research workspace UI SHALL let the user set the latest daily action outcome completion date when recording workflow practice evidence.

#### Scenario: Default new action outcome completion date
- **WHEN** the selected opportunity has no saved latest action outcome
- **THEN** the action outcome form SHALL default the completion date control to the user's current local date

#### Scenario: Preserve saved action outcome completion date
- **WHEN** the selected opportunity has a saved latest action outcome
- **THEN** the action outcome form SHALL initialize the completion date control from the saved `completedAt` timestamp

#### Scenario: Save selected action completion date
- **WHEN** the user saves an action outcome with a selected completion date
- **THEN** the frontend SHALL send `completedAt` using the selected date through the existing action outcome write API

#### Scenario: Keep completion date scoped to workflow evidence
- **WHEN** action outcome completion dates are displayed or saved
- **THEN** the UI SHALL label them as workflow practice evidence and SHALL NOT present them as sales, demand, margin, ROI, score, market evidence, a reminder, a streak, or a training grade
