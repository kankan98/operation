## ADDED Requirements

### Requirement: Show opportunity business readiness labels
Opportunity business signal displays SHALL present business readiness and missing assumption labels using merchant-facing copy without changing persisted business fields or metric calculations.

#### Scenario: Render opportunity business completeness
- **WHEN** the opportunity workspace displays business assumption completeness for a candidate
- **THEN** the UI SHALL show readable Chinese labels for none, partial, and complete readiness states instead of strings such as `business none` or `business partial`

#### Scenario: Render opportunity business missing assumptions
- **WHEN** the opportunity workspace displays known missing business assumptions for a candidate
- **THEN** the UI SHALL show merchant-facing Chinese labels for cost, shipping, fees, referral rate, advertising, tax/customs, target price, and target units
- **AND** the UI SHALL continue to preserve original API keys for persistence, filtering, and scoring calculations
