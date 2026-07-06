## MODIFIED Requirements

### Requirement: Create new product
The system SHALL allow users to add new products through a dialog form and continue directly into first research setup for the created product.

#### Scenario: Open add product dialog
- **WHEN** user clicks "Add Product" button
- **THEN** system SHALL open a dialog with empty product form

#### Scenario: Submit valid product form
- **WHEN** user fills required fields (platform, productUrl, asin, title) and submits
- **THEN** system SHALL create the product via POST /api/products, close the dialog, and navigate to `/products/:id` for the created product with first-setup route state

#### Scenario: Validate required fields
- **WHEN** user submits form without required fields
- **THEN** system SHALL display field-level validation errors and prevent submission

#### Scenario: Validate URL format
- **WHEN** user enters invalid URL in productUrl field
- **THEN** system SHALL display "Must be a valid URL" error message
