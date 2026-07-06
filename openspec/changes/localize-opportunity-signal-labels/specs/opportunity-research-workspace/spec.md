## ADDED Requirements

### Requirement: Localize workspace signal diagnostics
The opportunity research workspace UI SHALL render known business, market, and scoring signal diagnostics as readable Chinese labels across workspace surfaces.

#### Scenario: Render candidate row signal labels
- **WHEN** an opportunity row displays business readiness, market status, business missing signals, or market missing signals
- **THEN** the row SHALL show user-facing Chinese labels rather than raw internal status or signal keys

#### Scenario: Render selected detail signal labels
- **WHEN** the selected opportunity detail displays recommendation gates, missing signals, market summaries, business summaries, or factor explanations
- **THEN** those surfaces SHALL show readable labels for known signal keys rather than raw internal keys

#### Scenario: Render snapshot and comparison signal labels
- **WHEN** decision snapshots or opportunity comparison cells display known missing signals, business gaps, market gaps, or gate signal keys
- **THEN** they SHALL use the same readable labels as the selected detail and row surfaces
- **AND** they SHALL preserve saved snapshot source semantics and SHALL NOT infer current values into saved snapshot evidence
