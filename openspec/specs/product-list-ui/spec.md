# Product List UI Specification

## Purpose

This capability provides a visual interface for browsing, searching, and managing monitored products with CRUD operations accessible through dialog forms.

---

## Requirements

### Requirement: Display products in card layout
The system SHALL display products as cards in a responsive grid layout.

#### Scenario: Show product card with basic information
- **WHEN** viewing products list
- **THEN** system SHALL display each product as a card showing title, platform, image, current price, and monitoring status badge

#### Scenario: Arrange cards in responsive grid
- **WHEN** viewing on different screen sizes
- **THEN** system SHALL display 3 columns on desktop (1280px+), 2 columns on tablet (768px+), and 1 column on mobile

#### Scenario: Show monitoring badge for active products
- **WHEN** product has isMonitoring=true
- **THEN** system SHALL display a "Monitoring" badge on the card

### Requirement: Create new product
The system SHALL allow users to add new products through a dialog form.

#### Scenario: Open add product dialog
- **WHEN** user clicks "Add Product" button
- **THEN** system SHALL open a dialog with empty product form

#### Scenario: Submit valid product form
- **WHEN** user fills required fields (platform, productUrl, asin, title) and submits
- **THEN** system SHALL create the product via POST /api/products and close the dialog

#### Scenario: Validate required fields
- **WHEN** user submits form without required fields
- **THEN** system SHALL display field-level validation errors and prevent submission

#### Scenario: Validate URL format
- **WHEN** user enters invalid URL in productUrl field
- **THEN** system SHALL display "Must be a valid URL" error message

### Requirement: Edit existing product
The system SHALL allow users to update product information.

#### Scenario: Open edit dialog from product card
- **WHEN** user clicks edit button on a product card
- **THEN** system SHALL open dialog pre-filled with current product data

#### Scenario: Update product and refresh list
- **WHEN** user modifies fields and submits edit form
- **THEN** system SHALL update product via PATCH /api/products/:id and refresh the product list

### Requirement: Delete product
The system SHALL allow users to remove products from monitoring.

#### Scenario: Confirm before deletion
- **WHEN** user clicks delete button on product card
- **THEN** system SHALL show confirmation dialog asking "Are you sure you want to delete this product?"

#### Scenario: Delete product on confirmation
- **WHEN** user confirms deletion
- **THEN** system SHALL delete product via DELETE /api/products/:id and remove card from list

#### Scenario: Cancel deletion
- **WHEN** user cancels deletion confirmation
- **THEN** system SHALL close confirmation dialog without deleting product

### Requirement: Navigate to product detail
The system SHALL allow users to view detailed information for a product.

#### Scenario: Navigate on view button click
- **WHEN** user clicks "View" button on product card
- **THEN** system SHALL navigate to /products/:id detail page

### Requirement: Open product URL in new tab
The system SHALL allow users to view the product on the original platform.

#### Scenario: Open external link
- **WHEN** user clicks external link button on product card
- **THEN** system SHALL open productUrl in a new browser tab

### Requirement: Handle empty state
The system SHALL display appropriate message when no products exist.

#### Scenario: Show empty state message
- **WHEN** no products exist in the database
- **THEN** system SHALL display "No products yet. Add your first product to start monitoring."

