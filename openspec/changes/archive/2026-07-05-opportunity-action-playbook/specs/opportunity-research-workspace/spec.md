## MODIFIED Requirements

### Requirement: Expose daily opportunity action plan
The opportunity research workspace SHALL expose a derived daily action plan for active research entries without changing opportunity scoring.

#### Scenario: Return ordered action items
- **WHEN** a client requests the daily opportunity action plan
- **THEN** the response SHALL include workflow action items with stable identifiers, labels, priority, counts, reasons, suggested filter state, generated timestamp, deterministic playbook guidance, and a non-scoring caveat

#### Scenario: Return playbook guidance
- **WHEN** the daily opportunity action plan contains an action item
- **THEN** each action item SHALL include a learning goal, bounded execution steps, and bounded completion criteria for that action type

#### Scenario: Prioritize review discipline
- **WHEN** multiple action categories have matching active entries
- **THEN** the action plan SHALL order missing-next-action decisions before stale decisions, stale decisions before undecided candidates, and undecided candidates before general research continuation

#### Scenario: Omit empty actions
- **WHEN** an action category has zero matching active entries
- **THEN** the action plan SHALL omit that action item from the returned list

#### Scenario: Action plan excludes archived entries
- **WHEN** archived research entries exist
- **THEN** the daily action plan SHALL count only active non-archived research entries

#### Scenario: Action plan remains non-scoring
- **WHEN** action plan counts or playbook guidance change because workflow metadata changes
- **THEN** opportunity score, confidence, recommendation, recommendation gate, and factor contributions SHALL NOT change because of action plan metadata

### Requirement: Surface daily action plan in opportunity workspace UI
The opportunity research workspace UI SHALL show a compact daily action plan so the user can start review work from explicit workflow actions.

#### Scenario: Display workflow action list
- **WHEN** the opportunity workspace loads
- **THEN** the UI SHALL show daily action items with labels, counts, workflow reasons, learning goals, execution steps, and completion criteria near the review summary

#### Scenario: Apply suggested review filters
- **WHEN** the user selects a daily action item
- **THEN** the workspace SHALL apply that action item's suggested review filter state using the existing opportunity list filters

#### Scenario: Keep action plan scoped to workflow practice
- **WHEN** daily action items are displayed
- **THEN** the UI SHALL label them as workflow or review actions and SHALL NOT present them as sales, demand, margin, ROI, or score evidence
