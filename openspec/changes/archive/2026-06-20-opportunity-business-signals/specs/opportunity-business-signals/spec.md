## ADDED Requirements

### Requirement: Persist product business assumptions
The system SHALL persist merchant-provided business assumptions for a product without mixing them with provider-acquired product facts.

#### Scenario: Save complete assumptions
- **WHEN** a merchant saves business assumptions for a product with cost, shipping, fees, advertising, tax buffer, currency, and target sell price
- **THEN** the system SHALL persist the assumptions linked to that product and return the saved record with timestamps

#### Scenario: Update existing assumptions
- **WHEN** a merchant updates business assumptions for a product that already has assumptions
- **THEN** the system SHALL replace the editable assumption fields and update the modification timestamp

#### Scenario: Reject assumptions for missing product
- **WHEN** a merchant submits business assumptions for a product ID that does not exist
- **THEN** the system SHALL reject the request with a product-not-found error

### Requirement: Validate business assumption inputs
The system SHALL validate business assumption inputs before persistence or calculation.

#### Scenario: Reject negative monetary values
- **WHEN** a business assumption request contains a negative product cost, shipping cost, fee, advertising cost, tax buffer, or target sell price
- **THEN** validation SHALL reject the request with field-level errors

#### Scenario: Validate referral fee rate
- **WHEN** a business assumption request contains a referral fee rate outside the inclusive range from 0 to 1
- **THEN** validation SHALL reject the request with a field-level error

#### Scenario: Require currency when assumptions exist
- **WHEN** a business assumption request contains monetary assumptions
- **THEN** the request SHALL include a supported currency code

### Requirement: Compute assumption-based financial metrics
The system SHALL compute derived financial metrics from product price context and merchant business assumptions.

#### Scenario: Compute complete metrics
- **WHEN** a product has a usable sell price, cost basis, shipping, fulfillment, platform, referral, advertising, and tax/customs assumptions
- **THEN** the system SHALL return gross margin, net margin, ROI, breakeven sell price, contribution profit per unit, total variable cost, and assumption completeness

#### Scenario: Use target sell price first
- **WHEN** a target sell price is provided in business assumptions
- **THEN** financial metrics SHALL use the target sell price as revenue and expose `target` as the price source

#### Scenario: Fall back to current product price
- **WHEN** no target sell price is provided and the product has a current price
- **THEN** financial metrics SHALL use the current product price as revenue and expose `current_price` as the price source

#### Scenario: Mark incomplete metrics
- **WHEN** required assumptions for margin or ROI are missing
- **THEN** the system SHALL return missing business signal names and SHALL NOT treat missing cost or fees as zero

### Requirement: Explain business metric provenance
The system SHALL make clear that business metrics are calculated from merchant assumptions.

#### Scenario: Return assumption-based caveat
- **WHEN** business metrics are returned through an API, UI, or Chat tool
- **THEN** the response SHALL identify the metrics as assumption-based and not verified marketplace demand or sales data

#### Scenario: Return formula inputs
- **WHEN** derived financial metrics are returned
- **THEN** the response SHALL include the input components used for the calculation or references to the saved assumption fields
