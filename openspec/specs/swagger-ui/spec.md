## Purpose

Swagger UI provides interactive browser-based API documentation backed by the generated OpenAPI specification.

## Requirements

### Requirement: Swagger UI Integration
The system SHALL integrate Swagger UI to provide an interactive API documentation interface.

#### Scenario: Swagger UI is accessible
- **WHEN** a GET request is made to /api-docs
- **THEN** Swagger UI renders with the complete API documentation interface

#### Scenario: Swagger UI loads OpenAPI spec
- **WHEN** Swagger UI page loads
- **THEN** it automatically fetches and displays the OpenAPI specification from /api-docs.json

#### Scenario: Swagger UI displays all endpoints
- **WHEN** the Swagger UI page is rendered
- **THEN** all 6 route groups are displayed with expandable sections for each endpoint

### Requirement: Interactive API Testing
The system SHALL enable API testing directly from Swagger UI.

#### Scenario: Try it out button is available
- **WHEN** viewing any endpoint in Swagger UI
- **THEN** a "Try it out" button is available to enable interactive testing

#### Scenario: Request execution from Swagger UI
- **WHEN** user fills in parameters and clicks "Execute" in Swagger UI
- **THEN** the actual API request is sent and the response is displayed with status code and body

#### Scenario: Response examples are shown
- **WHEN** viewing any endpoint in Swagger UI
- **THEN** example responses for different status codes are displayed

### Requirement: Swagger UI Customization
The system SHALL customize Swagger UI appearance to match the application branding.

#### Scenario: Custom page title
- **WHEN** Swagger UI page is loaded
- **THEN** the browser tab shows "Price Monitor API Docs" as the title

#### Scenario: Topbar is hidden
- **WHEN** Swagger UI page is rendered
- **THEN** the default Swagger topbar is hidden for a cleaner interface

### Requirement: Schema Documentation
The system SHALL display all schema definitions with field descriptions in Swagger UI.

#### Scenario: Product schema is documented
- **WHEN** viewing the Product schema in Swagger UI
- **THEN** all fields are listed with types, constraints, and descriptions

#### Scenario: Enum values are displayed
- **WHEN** viewing a schema with enum fields in Swagger UI
- **THEN** all possible enum values are listed (e.g., platform: amazon, walmart, aliexpress, ebay, other)

### Requirement: Request/Response Examples
The system SHALL provide example request bodies and responses in Swagger UI.

#### Scenario: Create product example is shown
- **WHEN** viewing POST /api/products in Swagger UI
- **THEN** an example request body with valid product data is displayed

#### Scenario: Response examples include all fields
- **WHEN** viewing any endpoint's response in Swagger UI
- **THEN** example responses include all schema fields with realistic sample data

### Requirement: Authentication Documentation
The system SHALL document authentication requirements in Swagger UI (if applicable in future).

#### Scenario: Authentication section is prepared
- **WHEN** viewing the Swagger UI
- **THEN** the security schemes section is ready to document future authentication methods

### Requirement: Error Response Documentation
The system SHALL document standard error responses in Swagger UI.

#### Scenario: Validation error format is documented
- **WHEN** viewing a POST or PATCH endpoint in Swagger UI
- **THEN** the 400 response includes the Zod error format with detailed field errors

#### Scenario: Common error codes are listed
- **WHEN** viewing any endpoint in Swagger UI
- **THEN** standard error responses (400, 404, 500) are documented with descriptions
