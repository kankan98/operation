## ADDED Requirements

### Requirement: Edit product business assumptions
The product module SHALL let merchants view and edit product-level business assumptions from product detail workflows.

#### Scenario: Display existing assumptions
- **WHEN** a product has saved business assumptions
- **THEN** the product detail page SHALL display the assumption fields, currency, last updated timestamp, and assumption-based caveat

#### Scenario: Display empty assumption state
- **WHEN** a product has no saved business assumptions
- **THEN** the product detail page SHALL show an empty state that invites the merchant to add cost, shipping, fee, advertising, and tax assumptions

#### Scenario: Save assumptions from product detail
- **WHEN** a merchant edits valid business assumptions and saves the form
- **THEN** the product detail page SHALL persist the assumptions through the backend API and refresh derived financial metrics

#### Scenario: Show validation errors
- **WHEN** a merchant submits invalid business assumptions
- **THEN** the product detail page SHALL show field-level validation errors without discarding the user's entered values

### Requirement: Display business metrics in product detail
The product module SHALL display derived financial metrics for product selection decisions when available.

#### Scenario: Show complete metrics
- **WHEN** derived business metrics are complete
- **THEN** the product detail page SHALL show net margin, ROI, breakeven sell price, contribution profit per unit, total variable cost, and the price source used

#### Scenario: Show missing metric inputs
- **WHEN** derived business metrics are incomplete
- **THEN** the product detail page SHALL show which assumptions are missing instead of showing misleading zero-cost calculations

### Requirement: Use business signals in opportunity workbench
The opportunity workbench SHALL include business signal information in ranked product selection workflows.

#### Scenario: Display business columns
- **WHEN** opportunity results include business metrics
- **THEN** each opportunity row or card SHALL display net margin, ROI, contribution profit, completeness, and key missing business signals when space allows

#### Scenario: Filter by business readiness
- **WHEN** a merchant filters opportunities by business signal completeness
- **THEN** the workbench SHALL show only products matching the selected completeness state

#### Scenario: Preserve existing opportunity actions
- **WHEN** an opportunity result recommends `check_data`
- **THEN** the workbench SHALL continue to expose the manual acquisition action and SHALL also identify missing business assumptions when relevant
