## ADDED Requirements

### Requirement: OpenAPI Document Generation
The system SHALL generate a valid OpenAPI 3.0 specification document from Zod schemas automatically.

#### Scenario: Generate OpenAPI from Zod schemas
- **WHEN** the application starts or the generation script is invoked
- **THEN** a valid OpenAPI 3.0 JSON document is created with all schemas, paths, and operations defined

#### Scenario: OpenAPI document includes all API endpoints
- **WHEN** the OpenAPI spec is generated
- **THEN** all 6 route groups (products, alerts, price-snapshots, scraper, alert-rules, analysis) are included with correct paths and methods

#### Scenario: OpenAPI document includes schema definitions
- **WHEN** the OpenAPI spec is generated
- **THEN** all Zod schemas are converted to OpenAPI schema objects in the components/schemas section

### Requirement: Request Body Schema Registration
The system SHALL register Zod schemas for request bodies in the OpenAPI registry for all POST, PATCH endpoints.

#### Scenario: Product creation endpoint has request schema
- **WHEN** POST /api/products is documented in OpenAPI
- **THEN** the request body references the CreateProduct schema with all required fields marked

#### Scenario: Alert creation endpoint has request schema
- **WHEN** POST /api/alerts is documented in OpenAPI
- **THEN** the request body references the CreateAlert schema with validation constraints

### Requirement: Response Schema Registration
The system SHALL register Zod schemas for response bodies in the OpenAPI registry for all endpoints.

#### Scenario: Product response includes full schema
- **WHEN** GET /api/products/:id success response is documented
- **THEN** the 200 response references the Product schema with all fields

#### Scenario: Error responses are documented
- **WHEN** any endpoint is documented in OpenAPI
- **THEN** 400, 404, and 500 error responses are included with standard error schema

### Requirement: OpenAPI Metadata
The system SHALL include comprehensive metadata in the generated OpenAPI document.

#### Scenario: OpenAPI document has API info
- **WHEN** the OpenAPI spec is generated
- **THEN** it includes title "Price Monitor API", version "1.0.0", and description in Chinese

#### Scenario: OpenAPI document has server configuration
- **WHEN** the OpenAPI spec is generated
- **THEN** it includes at least the development server URL (http://localhost:3000)

### Requirement: Path Parameter Documentation
The system SHALL document all path parameters with correct types and descriptions in OpenAPI spec.

#### Scenario: Product ID parameter is documented
- **WHEN** GET /api/products/{id} is documented
- **THEN** the id parameter is marked as required, type string, and includes a description

### Requirement: Query Parameter Documentation
The system SHALL document all query parameters with correct types, enums, and default values in OpenAPI spec.

#### Scenario: Product list query parameters are documented
- **WHEN** GET /api/products is documented
- **THEN** platform, monitoring, page, and limit query parameters are included with correct types

#### Scenario: Alert list filters are documented
- **WHEN** GET /api/alerts is documented
- **THEN** productId, severity, unreadOnly, page, and limit query parameters are documented

### Requirement: Tag Organization
The system SHALL organize OpenAPI endpoints into logical tags matching the route groups.

#### Scenario: Endpoints are grouped by tags
- **WHEN** the OpenAPI spec is generated
- **THEN** endpoints are tagged with "Products", "Alerts", "Price Snapshots", "Scraper", "Alert Rules", "Analysis"

### Requirement: OpenAPI Spec Accessibility
The system SHALL expose the generated OpenAPI specification as a JSON endpoint.

#### Scenario: OpenAPI JSON is available
- **WHEN** a GET request is made to /api-docs.json
- **THEN** the complete OpenAPI 3.0 specification is returned as JSON with Content-Type: application/json
