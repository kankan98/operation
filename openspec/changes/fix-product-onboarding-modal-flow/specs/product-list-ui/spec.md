## ADDED Requirements

### Requirement: Product form dialog remains fully operable
The product list UI SHALL keep all add/edit product form fields, validation messages, and form actions reachable inside the dialog across desktop and mobile viewport sizes.

#### Scenario: Add product dialog exposes all required controls
- **WHEN** the user opens the add product dialog from an empty product list
- **THEN** the dialog SHALL expose platform, product URL, ASIN or product ID, title, currency, monitoring, check interval, cancel, and submit controls without clipping unreachable content

#### Scenario: Validation errors preserve form reachability
- **WHEN** the user submits the add product dialog with missing required fields
- **THEN** field-level validation messages SHALL be shown
- **THEN** the user SHALL still be able to reach every field and action in the dialog

### Requirement: Product form submission failures are visible
The product list UI SHALL display backend create/edit product failures inside the active dialog without clearing entered form values.

#### Scenario: Create product request fails
- **WHEN** the user submits a valid add product form and the backend rejects the request
- **THEN** the dialog SHALL display a visible error message explaining that the product was not saved
- **THEN** the entered field values SHALL remain available for correction and retry

#### Scenario: Edit product request fails
- **WHEN** the user submits a valid edit product form and the backend rejects the request
- **THEN** the dialog SHALL display a visible error message explaining that the product was not updated
- **THEN** the entered field values SHALL remain available for correction and retry
