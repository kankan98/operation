## MODIFIED Requirements

### Requirement: Validate business assumption inputs
The system SHALL validate business assumption inputs before persistence or calculation. UI clients SHALL submit referral fee rate as a normalized fraction from 0 to 1, while accepting common percentage-style user input by normalizing it before persistence.

#### Scenario: Reject negative monetary values
- **WHEN** a business assumption request contains a negative product cost, shipping cost, fee, advertising cost, tax buffer, or target sell price
- **THEN** validation SHALL reject the request with field-level errors

#### Scenario: Validate referral fee rate
- **WHEN** a business assumption request contains a referral fee rate outside the inclusive range from 0 to 1
- **THEN** validation SHALL reject the request with a field-level error

#### Scenario: Normalize percentage-style referral fee input from the UI
- **WHEN** a merchant enters `12` as the referral fee rate in the product detail business assumptions form
- **THEN** the UI SHALL submit `0.12` to the business assumptions API
- **AND** the saved assumptions SHALL calculate referral fee metrics using 12%

#### Scenario: Preserve fractional referral fee input from the UI
- **WHEN** a merchant enters `0.12` as the referral fee rate in the product detail business assumptions form
- **THEN** the UI SHALL submit `0.12` to the business assumptions API

#### Scenario: Require currency when assumptions exist
- **WHEN** a business assumption request contains monetary assumptions
- **THEN** the request SHALL include a supported currency code
