## ADDED Requirements

### Requirement: Show selected action outcome summary
The opportunity research workspace UI SHALL show a neutral summary of the currently selected action outcome type before users save latest action outcome evidence.

#### Scenario: Display default selected action summary
- **WHEN** the selected candidate has no saved latest action outcome and no transient workflow action context
- **THEN** the action outcome form SHALL show the current selected action type that will be saved

#### Scenario: Display context-selected action summary
- **WHEN** transient workflow action context preselects an action outcome type for a candidate without a saved latest action outcome
- **THEN** the action outcome form SHALL show the current selected action type alongside the transient context display

#### Scenario: Update selected action summary
- **WHEN** the user changes the selected action outcome type before saving
- **THEN** the selected action summary SHALL update to match the newly selected action type

#### Scenario: Preserve saved outcome priority
- **WHEN** the selected candidate already has a saved latest action outcome
- **THEN** the form SHALL show the saved action outcome and SHALL NOT show a separate unsaved selected action summary

#### Scenario: Keep selected action summary display-only
- **WHEN** the selected action summary is displayed
- **THEN** it SHALL NOT change opportunity score, confidence, recommendation, recommendation gate, market signals, business metrics, factor contributions, action outcome persistence, reminders, alerts, schedules, analytics, action history, AI coaching, or training grades
