## ADDED Requirements

### Requirement: Product opportunity workbench
The product module SHALL provide an opportunity workbench for scanning and comparing ranked product opportunities.

#### Scenario: Open opportunity workbench
- **WHEN** a user navigates to the opportunity workbench
- **THEN** the frontend SHALL request ranked opportunity products from the opportunity API

#### Scenario: Display opportunity score
- **WHEN** opportunity results are available
- **THEN** each product row or card SHALL display score, confidence, recommended action, platform, current price, and key reason text

#### Scenario: Display score breakdown
- **WHEN** a user opens a product opportunity explanation
- **THEN** the UI SHALL show factor breakdowns, missing signals, acquisition health, and recommendation rationale

### Requirement: Filter and sort opportunities
The opportunity workbench SHALL support filters and sorting for selection workflows.

#### Scenario: Filter by recommendation
- **WHEN** a user selects a recommendation filter
- **THEN** the workbench SHALL show only products with that recommended action

#### Scenario: Filter by score threshold
- **WHEN** a user sets a minimum opportunity score
- **THEN** the workbench SHALL hide products below that score

#### Scenario: Sort by confidence or score
- **WHEN** a user changes sort order
- **THEN** the workbench SHALL reorder products by score or confidence without losing active filters

### Requirement: Act on opportunity results
The opportunity workbench SHALL let users move from opportunity review into existing product workflows.

#### Scenario: View product detail
- **WHEN** a user selects a product from the opportunity workbench
- **THEN** the UI SHALL navigate to the product detail page

#### Scenario: Trigger data check
- **WHEN** an opportunity result recommends `check_data`
- **THEN** the UI SHALL expose an action to run manual product acquisition through the existing scraper API
