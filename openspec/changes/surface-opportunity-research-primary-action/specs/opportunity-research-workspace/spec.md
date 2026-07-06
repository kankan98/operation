## ADDED Requirements

### Requirement: Surface research join action in selected detail
The opportunity research workspace UI SHALL expose the selected candidate's join-research action in the detail header when that candidate is not yet in the research workspace.

#### Scenario: Join research from selected detail header
- **WHEN** a user selects an opportunity candidate without research metadata
- **THEN** the selected detail header SHALL show a visible action for adding that candidate to the research workspace without requiring the user to scroll the detail panel
- **AND** activating the action SHALL create or update the research entry using the same default research metadata as the existing row-level join action

#### Scenario: Hide header join action after research exists
- **WHEN** the selected opportunity already has research metadata
- **THEN** the selected detail header SHALL NOT show the join-research action
- **AND** the existing research metadata editor SHALL remain available for status, priority, tags, and notes

#### Scenario: Preserve opportunity scoring semantics
- **WHEN** the selected detail header join action is shown, hidden, or activated
- **THEN** the UI SHALL NOT change opportunity score, confidence, recommendation, recommendation gate, market signals, business metrics, factor contributions, or acquisition operational state except through the existing research metadata mutation response
