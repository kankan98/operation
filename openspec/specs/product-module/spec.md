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
