# Product List & Detail UI

## Purpose

This capability provides comprehensive product management interfaces including a catalog view (table/card layouts), detailed product information display, inventory tracking, performance metrics, AI-powered recommendations, and bulk action support. The interface supports e-commerce merchants in managing their product portfolio efficiently.
## Requirements
### Requirement: Product catalog display
The system SHALL display products in table or card view with image, title, status, pricing, inventory, and performance metrics.

#### Scenario: Table view layout
- **WHEN** user views products in table mode
- **THEN** system displays columns: Product (image + name), Status, Price, Inventory, Revenue, Units Sold, Trend, Actions

#### Scenario: Card view layout
- **WHEN** user views products in card mode
- **THEN** system displays product cards in responsive grid with image, title, status badge, price, inventory count, and revenue metric

#### Scenario: View mode toggle
- **WHEN** user clicks view mode toggle button
- **THEN** system switches between table and card view layouts
- **THEN** system persists user's view preference

### Requirement: Product status indicators
The system SHALL display product status with color-coded badges (Active, Draft, Out of Stock, Discontinued).

#### Scenario: Status badge display
- **WHEN** rendering product with Active status
- **THEN** system displays green Success badge with "Active" label
- **WHEN** rendering product with Out of Stock status
- **THEN** system displays orange Warning badge with "Out of Stock" label
- **WHEN** rendering product with Discontinued status
- **THEN** system displays red Error badge with "Discontinued" label

### Requirement: Inventory tracking
The system SHALL display current inventory levels with visual indicators for low stock warnings.

#### Scenario: Inventory count display
- **WHEN** rendering product with sufficient inventory
- **THEN** system displays inventory count in neutral text
- **WHEN** product inventory falls below threshold (e.g., < 10 units)
- **THEN** system displays inventory count in warning orange with low stock icon

#### Scenario: Out of stock indication
- **WHEN** product inventory reaches zero
- **THEN** system displays "Out of Stock" status badge and disables purchase-related actions

### Requirement: Performance metrics
The system SHALL display revenue, units sold, and trend indicators for each product.

#### Scenario: Revenue display
- **WHEN** rendering product
- **THEN** system displays total revenue with currency formatting according to locale

#### Scenario: Trend visualization
- **WHEN** product performance is improving
- **THEN** system displays green upward arrow with percentage increase
- **WHEN** product performance is declining
- **THEN** system displays red downward arrow with percentage decrease

### Requirement: AI recommendations
The system SHALL display AI-generated recommendations for product optimization (pricing, inventory, advertising).

#### Scenario: Recommendation badge
- **WHEN** AI system identifies optimization opportunity for product
- **THEN** system displays blue Info badge with "AI Recommendation" label on product card/row

#### Scenario: Recommendation details
- **WHEN** user clicks AI recommendation badge
- **THEN** system displays popover or modal with recommendation details (what, why, suggested action)

### Requirement: Product filtering and search
The system SHALL provide search bar and filters for status, category, inventory level, and performance.

#### Scenario: Text search
- **WHEN** user types in search bar
- **THEN** system filters products matching query in name, SKU, or description

#### Scenario: Status filter
- **WHEN** user selects status filter (Active, Draft, Out of Stock)
- **THEN** system displays only products matching selected status

#### Scenario: Inventory filter
- **WHEN** user selects "Low Stock" filter
- **THEN** system displays only products with inventory below threshold

#### Scenario: Filter combination
- **WHEN** user applies multiple filters
- **THEN** system displays products matching ALL selected filters (AND logic)

### Requirement: Product sorting
The system SHALL allow sorting by name, price, inventory, revenue, and trend.

#### Scenario: Sort interaction
- **WHEN** user clicks sortable column header
- **THEN** system sorts products by that column in ascending order
- **WHEN** user clicks same column header again
- **THEN** system toggles to descending order

### Requirement: Bulk actions
The system SHALL support bulk selection and actions on multiple products.

#### Scenario: Product selection
- **WHEN** user clicks checkbox on product
- **THEN** system marks product as selected with Primary-50 background highlight
- **WHEN** user clicks "Select All" checkbox in table header
- **THEN** system selects all visible products

#### Scenario: Bulk actions availability
- **WHEN** one or more products are selected
- **THEN** system displays bulk action toolbar with options: Update Status, Adjust Pricing, Export, Delete

### Requirement: Product quick actions
The system SHALL provide quick actions on hover (Edit, Duplicate, View Analytics, Delete).

#### Scenario: Quick action visibility
- **WHEN** user hovers over product row or card
- **THEN** system reveals quick action buttons (Edit, More menu)

#### Scenario: More menu actions
- **WHEN** user clicks More (⋯) button
- **THEN** system displays dropdown menu with Duplicate, View Analytics, Archive, Delete options

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

### Requirement: Display market signals in product detail
The product module SHALL display latest market signal freshness, provider provenance, and trend summaries on product detail surfaces.

#### Scenario: Show fresh market signals
- **WHEN** a product has a latest market signal snapshot
- **THEN** the product detail page SHALL show provider, source, confidence, freshness, price trend summary, rank trend summary, review velocity, rating movement, and safe caveats

#### Scenario: Show missing market signals
- **WHEN** a product has no market signal snapshot
- **THEN** the product detail page SHALL show a missing market signals state and an action to refresh market signals when supported

#### Scenario: Show degraded market signal refresh
- **WHEN** the latest market signal refresh failed
- **THEN** the product detail page SHALL show failure reason, safe root cause, and remediation guidance without exposing credentials or raw provider payloads

### Requirement: Include market signals in opportunity workflows
The opportunity workbench SHALL make market trend evidence visible while scanning and comparing ranked products.

#### Scenario: Display opportunity market signal summary
- **WHEN** opportunity results include market signal factors
- **THEN** each opportunity result SHALL show market signal freshness and concise trend indicators alongside score, confidence, recommendation, platform, and price

#### Scenario: Explain opportunity market factors
- **WHEN** a user opens an opportunity explanation
- **THEN** the UI SHALL show market trend factors separately from merchant assumption factors and acquisition health

#### Scenario: Refresh market signals from opportunity workflow
- **WHEN** an opportunity result recommends checking missing market signals
- **THEN** the workbench SHALL expose a market signal refresh action for supported products

### Requirement: Show queue operations in opportunity workbench
The opportunity workbench SHALL show acquisition queue operations state separately from opportunity score and research metadata.

#### Scenario: Display queue health summary
- **WHEN** opportunity results include queue or product job diagnostics
- **THEN** each affected opportunity row SHALL show operational status such as delayed, retrying, rate-limited, stale worker, or healthy

#### Scenario: Keep score separate
- **WHEN** queue operations state is degraded
- **THEN** the workbench SHALL keep opportunity score, business signals, market signals, and research metadata visually and semantically separate from queue state

#### Scenario: Explain check-data recommendation
- **WHEN** an opportunity recommends `check_data` because acquisition data is stale or missing
- **THEN** the workbench SHALL include queue/job context so the user can distinguish missing data from weak product opportunity

### Requirement: Filter opportunities by operational state
The opportunity workbench SHALL allow users to identify opportunities blocked by acquisition operations.

#### Scenario: Filter delayed acquisition
- **WHEN** the user filters for delayed or blocked acquisition
- **THEN** the workbench SHALL show opportunities whose latest job is delayed by retry backoff, worker health, provider gate, or queue backlog

#### Scenario: Filter actionable retry
- **WHEN** the user filters for retryable acquisition jobs
- **THEN** the workbench SHALL show opportunities with failed or cancelled jobs that can be retried through supported controls

### Requirement: Display eBay acquisition provenance in product detail
The product module SHALL display eBay Browse acquisition status and provenance through existing product detail acquisition surfaces.

#### Scenario: Show successful eBay acquisition
- **WHEN** an eBay product has a successful Browse API attempt
- **THEN** the product detail page SHALL show provider `ebay-browse`, source `official_api`, confidence, last checked time, and safe metadata

#### Scenario: Show eBay acquisition failure
- **WHEN** an eBay product has a failed Browse API attempt
- **THEN** the product detail page SHALL show the failure reason, safe root cause, and remediation guidance without exposing credentials or raw provider payloads

#### Scenario: Show eBay insufficient history
- **WHEN** an eBay product has no acquisition attempts
- **THEN** the product detail page SHALL show an empty acquisition state and manual check action

### Requirement: Include eBay health in opportunity workflows
The opportunity workbench SHALL include eBay acquisition health and missing-signal context when eBay products are ranked.

#### Scenario: Display eBay opportunity source
- **WHEN** opportunity results include eBay products
- **THEN** each result SHALL show platform `ebay`, current price, confidence, acquisition health, and missing signals when available

#### Scenario: Preserve manual check action for eBay
- **WHEN** an eBay opportunity recommends `check_data`
- **THEN** the workbench SHALL expose the existing manual acquisition action and SHALL show eBay provider failure context after refresh

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

