## ADDED Requirements

### Requirement: Use accessible product form controls
The product form SHALL expose accessible labels for all editable fields so users and automated tests can target fields by label.

#### Scenario: Locate fields by label
- **WHEN** the add or edit product dialog is open
- **THEN** the platform, product URL, ASIN/Product ID, product title, brand, currency, enable monitoring, and check interval fields SHALL be associated with their visible labels

### Requirement: Display check interval as hours
The product form SHALL describe `checkInterval` using the same unit and range as the backend product contract.

#### Scenario: Show hour-based interval copy
- **WHEN** monitoring is enabled in the product form
- **THEN** the check interval label and helper text SHALL describe hours, the range 1 to 168 hours, and the default 24 hours

#### Scenario: Submit hour-based interval value
- **WHEN** a user submits a valid product form with check interval 24
- **THEN** the frontend SHALL send `checkInterval: 24` as 24 hours, not seconds or minutes

## MODIFIED Requirements

### Requirement: Edit existing product
The system SHALL allow users to update product information, including products whose optional URL fields are blank.

#### Scenario: Open edit dialog from product card
- **WHEN** user clicks edit button on a product card
- **THEN** system SHALL open dialog pre-filled with current product data

#### Scenario: Update product and refresh list
- **WHEN** user modifies fields and submits edit form
- **THEN** system SHALL update product via PATCH /api/products/:id and refresh the product list

#### Scenario: Edit product with blank optional image URL
- **WHEN** an existing product has no image URL
- **THEN** the edit form SHALL allow a valid title or metadata update to submit successfully without requiring an image URL

### Requirement: Handle empty state
The system SHALL display appropriate message and action when no products exist.

#### Scenario: Show empty state message
- **WHEN** no products exist in the database
- **THEN** system SHALL display "No products yet. Add your first product to start monitoring."

#### Scenario: Start product creation from empty state
- **WHEN** no products exist in the database
- **THEN** the empty state SHALL provide an add product action that opens the product creation dialog
