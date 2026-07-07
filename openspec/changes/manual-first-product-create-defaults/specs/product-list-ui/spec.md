## MODIFIED Requirements

### Requirement: Create new product
The system SHALL allow users to add new products through a dialog form whose create-mode defaults align with manual-first research.

#### Scenario: Open add product dialog
- **WHEN** user clicks "Add Product" button
- **THEN** system SHALL open a dialog with an empty product form
- **AND** the automatic monitoring checkbox MUST be unchecked by default
- **AND** the check interval field MUST NOT be visible until automatic monitoring is enabled

#### Scenario: Describe monitoring as optional
- **WHEN** the add product dialog is opened
- **THEN** the monitoring option MUST describe automatic checks as optional
- **AND** the form MUST NOT imply that automatic monitoring is required before manual readings or opportunity research can start

#### Scenario: Submit valid product form without monitoring
- **WHEN** user fills required fields (platform, productUrl, asin, title) and submits without enabling monitoring
- **THEN** system SHALL create the product via POST /api/products with `isMonitoring: false`
- **AND** system SHALL close the dialog

#### Scenario: Submit valid product form with monitoring enabled
- **WHEN** user fills required fields, enables monitoring, and submits
- **THEN** system SHALL create the product via POST /api/products with `isMonitoring: true` and the selected check interval
- **AND** system SHALL close the dialog

#### Scenario: Validate required fields
- **WHEN** user submits form without required fields
- **THEN** system SHALL display field-level validation errors and prevent submission

#### Scenario: Validate URL format
- **WHEN** user enters invalid URL in productUrl field
- **THEN** system SHALL display "Must be a valid URL" error message
