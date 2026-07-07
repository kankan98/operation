## MODIFIED Requirements

### Requirement: Product Schema Definition
The system SHALL define a Zod schema for Product entity that includes all fields from the database schema with appropriate validation rules and manual-first creation defaults.

#### Scenario: Product schema validates required fields
- **WHEN** a product creation request is submitted without required fields (platform, productUrl, asin, title)
- **THEN** Zod validation rejects the request with detailed field-level errors

#### Scenario: Product schema enforces field constraints
- **WHEN** a product creation request includes a title exceeding 500 characters
- **THEN** Zod validation rejects the request indicating the maximum length violation

#### Scenario: Product schema provides type inference
- **WHEN** TypeScript code imports the product schema
- **THEN** type definitions are automatically inferred using `z.infer<typeof schema>`

#### Scenario: Product creation defaults to manual-first monitoring state
- **WHEN** a product creation request omits `isMonitoring`
- **THEN** the product creation schema MUST parse `isMonitoring` as `false`
- **AND** the parsed product MUST remain valid with the default check interval
