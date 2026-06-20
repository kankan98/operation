## ADDED Requirements

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
