## ADDED Requirements

### Requirement: Gate recommendations by data confidence
The opportunity scoring service SHALL gate recommendation actions using critical missing or stale signals so high-scoring products are not presented as high-confidence opportunities when required evidence is absent.

#### Scenario: High score with missing business assumptions is gated
- **WHEN** a product's base score would produce `investigate` but margin or business assumptions are incomplete
- **THEN** the final recommendation SHALL be `check_data` and the response SHALL explain which business signals must be supplied before treating the product as an investigation candidate

#### Scenario: Missing price or acquisition history blocks recommendation
- **WHEN** a product lacks price history or acquisition history
- **THEN** the final recommendation SHALL be `check_data` regardless of score and the response SHALL include gate reasons for the missing history

#### Scenario: Stale market signal downgrades high recommendation
- **WHEN** a product's base recommendation is `investigate` but its market trend signal is stale
- **THEN** the final recommendation SHALL be no stronger than `watch` and the response SHALL recommend refreshing market trend evidence

#### Scenario: Gate explanation is returned with opportunity
- **WHEN** a product opportunity is returned from list or explain APIs
- **THEN** the response SHALL include `recommendationGate` with status, whether it changed the recommendation, original recommendation, final recommendation, gate reasons, triggering signals, and next actions
