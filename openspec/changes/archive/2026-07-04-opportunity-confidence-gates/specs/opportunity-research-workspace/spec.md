## ADDED Requirements

### Requirement: Display recommendation gate context
The opportunity research workspace SHALL display recommendation gate context so users understand why a candidate is ready to investigate, should only be watched, or needs more data.

#### Scenario: Show blocked recommendation gate
- **WHEN** the selected opportunity has a `recommendationGate.status` of `blocked`
- **THEN** the workspace SHALL show a visible warning that the recommendation is gated and list the gate reasons and next actions

#### Scenario: Show caution recommendation gate
- **WHEN** the selected opportunity has a `recommendationGate.status` of `caution`
- **THEN** the workspace SHALL show a caution state explaining why the recommendation should be treated as lower confidence

#### Scenario: Do not recompute gate in frontend
- **WHEN** the workspace renders recommendation gate context
- **THEN** it SHALL use the backend-provided `recommendationGate` fields rather than duplicating gate threshold logic in frontend code
