## ADDED Requirements

### Requirement: Display research state in opportunity workbench
The product module SHALL display and edit opportunity research state from the opportunity workbench.

#### Scenario: Show shortlist state in ranked results
- **WHEN** opportunity results include research metadata
- **THEN** each result row SHALL show shortlist status, priority, and tags separately from score, confidence, acquisition health, market signals, and business assumptions

#### Scenario: Add product to research workspace
- **WHEN** a user selects a shortlist action on an opportunity result
- **THEN** the frontend SHALL create or update the product's research entry and refresh opportunity research state

#### Scenario: Edit status tags and notes
- **WHEN** a user edits research status, tags, priority, or notes
- **THEN** the UI SHALL persist the change and keep the current opportunity selection visible

### Requirement: Compare opportunity candidates in the UI
The product module SHALL let users compare a bounded set of opportunity candidates side by side.

#### Scenario: Select products for comparison
- **WHEN** a user selects products from the opportunity workbench for comparison
- **THEN** the UI SHALL show the selected count and disable comparison when the selection is empty or over the supported limit

#### Scenario: Render comparison table
- **WHEN** comparison data is returned
- **THEN** the UI SHALL display product, platform, price, score, confidence, recommendation, research state, acquisition health, market signals, business metrics, and missing signals in a scannable table

#### Scenario: Keep caveats visible
- **WHEN** comparison includes market signals or business metrics
- **THEN** the UI SHALL display caveats that proxy trends and merchant assumptions are not verified sales, demand, margin, ROI, or profitability facts

### Requirement: Export opportunity research results from the UI
The product module SHALL expose export actions for researched or selected opportunities.

#### Scenario: Export selected shortlist
- **WHEN** a user chooses export for selected opportunities
- **THEN** the frontend SHALL request the export endpoint and download or display the generated CSV or JSON result

#### Scenario: Export disabled state
- **WHEN** no opportunities are selected and no exportable filter is active
- **THEN** the export action SHALL be disabled or explain what selection is required

### Requirement: Show research state in product detail
The product detail page SHALL show opportunity research metadata when a product has been shortlisted.

#### Scenario: Product has research entry
- **WHEN** a product detail page loads for a shortlisted product
- **THEN** the page SHALL show research status, priority, tags, notes, and last updated time

#### Scenario: Product not shortlisted
- **WHEN** a product detail page loads without research metadata
- **THEN** the page SHALL offer an action to add the product to the research workspace
