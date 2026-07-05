## ADDED Requirements

### Requirement: Show manual action context overrides
The opportunity research workspace UI SHALL show when the selected action outcome type manually differs from the transient workflow action context.

#### Scenario: Display manual override from daily action context
- **WHEN** a daily action context preselects an action outcome type and the user manually chooses a different action outcome type before saving
- **THEN** the form SHALL show the original context action and the current action type that will be saved

#### Scenario: Display manual override from practice bucket context
- **WHEN** a practice bucket context preselects an action outcome type and the user manually chooses a different action outcome type before saving
- **THEN** the form SHALL show the original context action and the current action type that will be saved

#### Scenario: Keep selected action guidance current
- **WHEN** a manual action context override is displayed
- **THEN** completion criteria and evidence prompts SHALL continue to match the current selected action outcome type

#### Scenario: Preserve saved outcome priority
- **WHEN** the selected candidate already has a saved latest action outcome
- **THEN** the form SHALL show the saved action outcome and SHALL NOT show a manual transient context override indicator

#### Scenario: Keep manual override display-only
- **WHEN** a manual action context override indicator is displayed
- **THEN** it SHALL NOT change opportunity score, confidence, recommendation, recommendation gate, market signals, business metrics, factor contributions, action outcome persistence, reminders, alerts, schedules, analytics, action history, AI coaching, or training grades
