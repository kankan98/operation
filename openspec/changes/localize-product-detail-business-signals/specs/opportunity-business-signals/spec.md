## ADDED Requirements

### Requirement: Keep business display labels separate from persisted fields
Business assumption UIs SHALL present merchant-facing labels without changing persisted business assumption field names or derived metric semantics.

#### Scenario: Save localized business form
- **WHEN** a merchant saves business assumptions from a localized product-detail form
- **THEN** the client SHALL submit the existing API fields for costs, fees, referral rate, target sell price, target units, currency, and notes
- **AND** derived metrics, completeness, missing-signal calculation, and opportunity scoring inputs SHALL remain based on the existing persisted fields
