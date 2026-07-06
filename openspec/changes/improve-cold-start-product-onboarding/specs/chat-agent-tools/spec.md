## ADDED Requirements

### Requirement: Reference real UI workflow names in Chat guidance
The Chat agent SHALL guide users using navigation and action names that exist in the current application UI.

#### Scenario: Guide cold-start user to first action
- **WHEN** the user asks what to do while the system has no products
- **THEN** Chat SHALL direct them to the `商品` page and the `添加商品` action instead of inventing non-existent UI entries

#### Scenario: Avoid unsupported platform guidance
- **WHEN** Chat suggests supported marketplaces or calls product tools
- **THEN** Chat SHALL limit platform guidance to `amazon`, `walmart`, `aliexpress`, `ebay`, and `other` unless a future capability adds another platform

#### Scenario: Avoid non-existent alert setup entry
- **WHEN** Chat explains alert setup in the current UI
- **THEN** Chat SHALL NOT claim that a visible `Create Alert` or equivalent alert-rule screen exists unless the UI provides it

## MODIFIED Requirements

### Requirement: Define addProductMonitoring tool
The system SHALL provide an addProductMonitoring tool that adds new products to monitoring system using the same validation contract as product creation APIs.

#### Scenario: Add product with URL
- **WHEN** agent calls addProductMonitoring with product URL, supported platform, product identifier, and title
- **THEN** system SHALL create new product record with isMonitoring set to true

#### Scenario: Validate URL format
- **WHEN** agent provides invalid URL format
- **THEN** system SHALL return error "Invalid product URL format for specified platform"

#### Scenario: Validate supported platform
- **WHEN** agent provides a platform that is not supported by the product schema
- **THEN** system SHALL return validation feedback and SHALL NOT create a product

#### Scenario: Validate required product identifier
- **WHEN** agent provides a non-Amazon product without a product identifier
- **THEN** system SHALL return validation feedback and SHALL NOT create a product with a blank ASIN/Product ID

#### Scenario: Check for duplicates
- **WHEN** product URL already exists in database
- **THEN** system SHALL return error "Product already being monitored"

#### Scenario: Set default check interval
- **WHEN** agent does not specify check interval
- **THEN** system SHALL set checkInterval to 24 hours by default
