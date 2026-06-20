## Purpose

OpenAPI generation produces machine-readable API documentation from the backend schema registry and route definitions.
## Requirements
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

### Requirement: Document market signal APIs
OpenAPI generation SHALL document product market signal refresh, latest snapshot, history, and provider health contracts.

#### Scenario: Document market signal refresh
- **WHEN** OpenAPI documentation is generated
- **THEN** it SHALL include the market signal refresh endpoint with success, provider-unavailable, unsupported-product, and quota-exhausted examples

#### Scenario: Document latest market signal snapshot
- **WHEN** OpenAPI documentation is generated
- **THEN** it SHALL include the latest market signal response schema with provider, source, confidence, freshness, price trend, rank trend, review velocity, rating movement, missing signals, and safe metadata

#### Scenario: Document market signal history
- **WHEN** OpenAPI documentation is generated
- **THEN** it SHALL include market signal history query parameters, bounded pagination or limit behavior, and example snapshot arrays

#### Scenario: Document Keepa provider health
- **WHEN** OpenAPI documentation is generated
- **THEN** it SHALL include Keepa market signal provider health examples for healthy, degraded, and insufficient-history states

### Requirement: Document market signal schema safety
OpenAPI generation SHALL document bounded diagnostics and caveats for market signal data.

#### Scenario: Provider enum includes Keepa
- **WHEN** OpenAPI schemas are generated
- **THEN** provider/source schema examples SHALL include provider `keepa` and source `third_party` where market signal metadata is returned

#### Scenario: Diagnostics omit Keepa secrets
- **WHEN** OpenAPI examples include Keepa diagnostics
- **THEN** examples SHALL show only redacted or safe diagnostic fields and SHALL NOT include API keys, credential-bearing URLs, authorization headers, or raw provider payloads

#### Scenario: Market signals caveat documented
- **WHEN** OpenAPI examples include opportunity responses with market signals
- **THEN** examples SHALL distinguish trend/proxy evidence from verified sales, demand, margin, ROI, or profitability facts

### Requirement: Document acquisition queue operations APIs
OpenAPI generation SHALL document queue health, worker health, product job diagnostics, and job control endpoints.

#### Scenario: Document queue health endpoint
- **WHEN** OpenAPI documentation is generated
- **THEN** it SHALL include queue health path, query parameters, response schema, status examples, and caveat examples

#### Scenario: Document worker health endpoint
- **WHEN** OpenAPI documentation is generated
- **THEN** it SHALL include worker health schema with heartbeat timestamp, stale state, backend, concurrency, active job count, and safe metadata

#### Scenario: Document job control endpoints
- **WHEN** OpenAPI documentation is generated
- **THEN** it SHALL include retry and cancel operations with validation errors and updated job-state responses

### Requirement: Document queue safety semantics
OpenAPI generation SHALL document that queue health is operational metadata only.

#### Scenario: Queue caveat in examples
- **WHEN** OpenAPI examples include queue health or product job diagnostics
- **THEN** the examples SHALL include a caveat that queue health explains acquisition operations and is not verified sales, demand, margin, ROI, or profitability evidence

#### Scenario: Diagnostics omit secrets
- **WHEN** OpenAPI examples include worker, Redis, provider, or queue diagnostics
- **THEN** examples SHALL omit Redis credentials, API keys, authorization headers, cookies, raw provider payloads, and raw HTML

### Requirement: Document eBay acquisition contracts
OpenAPI generation SHALL document eBay Browse provider acquisition and health contracts.

#### Scenario: Document eBay manual acquisition response
- **WHEN** OpenAPI documentation is generated
- **THEN** scraper product acquisition examples SHALL include an eBay success response with provider `ebay-browse`, source `official_api`, confidence, attemptId, and snapshotId

#### Scenario: Document eBay provider failure response
- **WHEN** OpenAPI documentation is generated
- **THEN** scraper product acquisition examples SHALL include an eBay provider-unavailable or not-found failure response using the standard error/acquisition response shape

#### Scenario: Document eBay provider health
- **WHEN** OpenAPI documentation is generated
- **THEN** it SHALL include eBay provider health path or platform query examples with healthy, degraded, and insufficient-history responses

### Requirement: Document eBay schema extensions
OpenAPI generation SHALL document provider/source enum extensions and eBay-safe diagnostic fields.

#### Scenario: Provider enum includes eBay
- **WHEN** OpenAPI schemas are generated
- **THEN** provider/source schema examples SHALL include `ebay-browse` and `official_api` where provider metadata is returned

#### Scenario: Diagnostics omit secrets
- **WHEN** OpenAPI examples include eBay diagnostics
- **THEN** examples SHALL show redacted safe fields and SHALL NOT include access tokens, client secrets, authorization headers, or raw provider payloads

### Requirement: Document product business signal APIs
OpenAPI generation SHALL document the product business signal API contracts.

#### Scenario: Register read endpoint
- **WHEN** OpenAPI documentation is generated
- **THEN** it SHALL include the endpoint for reading a product's business assumptions and derived metrics

#### Scenario: Register upsert endpoint
- **WHEN** OpenAPI documentation is generated
- **THEN** it SHALL include the endpoint for creating or updating a product's business assumptions with request and response schemas

#### Scenario: Document validation errors
- **WHEN** OpenAPI documentation is generated for business signal endpoints
- **THEN** it SHALL describe validation and product-not-found errors using existing error response conventions

### Requirement: Document opportunity business signal extensions
OpenAPI generation SHALL document business signal fields added to opportunity APIs.

#### Scenario: Opportunity list schema includes business fields
- **WHEN** OpenAPI documentation is generated
- **THEN** opportunity list response schemas SHALL include optional business metric summaries, completeness, missing business signals, and assumption caveats

#### Scenario: Opportunity explanation schema includes business factors
- **WHEN** OpenAPI documentation is generated
- **THEN** opportunity explanation response schemas SHALL include business factor breakdowns and derived metric details when available

### Requirement: Document opportunity research workspace APIs
OpenAPI generation SHALL document opportunity research entry, comparison, and export API contracts.

#### Scenario: Document research entry CRUD
- **WHEN** OpenAPI documentation is generated
- **THEN** it SHALL include endpoints for creating, reading, updating, archiving, and deleting product research entries with request and response schemas

#### Scenario: Document comparison endpoint
- **WHEN** OpenAPI documentation is generated
- **THEN** it SHALL include the comparison endpoint with product ID limits, response rows, and missing product validation examples

#### Scenario: Document export endpoint
- **WHEN** OpenAPI documentation is generated
- **THEN** it SHALL include CSV and JSON export request/response examples and documented export size limits

### Requirement: Document research caveats and non-scoring semantics
OpenAPI generation SHALL make research metadata semantics clear in API examples.

#### Scenario: Research metadata does not affect score
- **WHEN** OpenAPI examples include opportunity responses with research metadata
- **THEN** the examples SHALL document that status, tags, notes, and priority do not change opportunity score or factor contributions

#### Scenario: Export examples include caveats
- **WHEN** OpenAPI examples include exported opportunity rows
- **THEN** the examples SHALL include caveat fields for market proxy signals and merchant-entered business assumptions

