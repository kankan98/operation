## MODIFIED Requirements

### Requirement: Define addProductMonitoring tool
The system SHALL provide an addProductMonitoring tool that adds new products to monitoring system using the same required product fields enforced by product creation.

#### Scenario: Add product with required fields
- **WHEN** agent calls addProductMonitoring with platform, product URL, ASIN/product ID, and product title
- **THEN** system SHALL create new product record with isMonitoring set to true

#### Scenario: Require deterministic product identifier
- **WHEN** agent calls addProductMonitoring without an ASIN/product ID or resolvable Amazon ASIN
- **THEN** system SHALL return error "ASIN/Product ID is required for product monitoring"

#### Scenario: Validate URL format
- **WHEN** agent provides invalid URL format
- **THEN** system SHALL return error "Invalid product URL format for specified platform"

#### Scenario: Check for duplicates
- **WHEN** product URL already exists in database
- **THEN** system SHALL return error "Product already being monitored"

#### Scenario: Set default check interval
- **WHEN** agent does not specify check interval
- **THEN** system SHALL set checkInterval to 24 hours by default
