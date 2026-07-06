## ADDED Requirements

### Requirement: Display readable stock status choices
The manual reading UI SHALL display stock status choices with merchant-facing labels while preserving the internal availability values submitted to the price snapshot API.

#### Scenario: Manual reading stock status choices are shown to merchants
- **WHEN** the manual reading form renders the stock status select
- **THEN** the choices SHALL be displayed as `有货`, `库存偏低`, and `缺货`
- **AND** the raw internal labels `in_stock`, `low_stock`, and `out_of_stock` SHALL NOT be displayed as option text

#### Scenario: Manual reading stock status submission preserves enum value
- **WHEN** a merchant selects `库存偏低` and submits a valid manual reading
- **THEN** the submitted payload SHALL include `availability: 'low_stock'`
