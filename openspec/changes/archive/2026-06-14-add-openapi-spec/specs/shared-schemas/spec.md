## ADDED Requirements

### Requirement: Product Schema Definition
The system SHALL define a Zod schema for Product entity that includes all fields from the database schema with appropriate validation rules.

#### Scenario: Product schema validates required fields
- **WHEN** a product creation request is submitted without required fields (platform, productUrl, asin, title)
- **THEN** Zod validation rejects the request with detailed field-level errors

#### Scenario: Product schema enforces field constraints
- **WHEN** a product creation request includes a title exceeding 500 characters
- **THEN** Zod validation rejects the request indicating the maximum length violation

#### Scenario: Product schema provides type inference
- **WHEN** TypeScript code imports the product schema
- **THEN** type definitions are automatically inferred using `z.infer<typeof schema>`

### Requirement: Alert Schema Definition
The system SHALL define a Zod schema for Alert entity that validates alert types, severity levels, and required fields.

#### Scenario: Alert schema validates severity enum
- **WHEN** an alert creation request includes an invalid severity value
- **THEN** Zod validation rejects the request with allowed severity values (info, warning, critical)

#### Scenario: Alert schema enforces message length
- **WHEN** an alert creation request includes a message exceeding 1000 characters
- **THEN** Zod validation rejects the request indicating the maximum length violation

### Requirement: Alert Rule Schema Definition
The system SHALL define a Zod schema for AlertRule entity that validates rule types, conditions, and threshold values.

#### Scenario: Alert rule schema validates threshold
- **WHEN** an alert rule creation request includes a negative threshold for price_threshold type
- **THEN** Zod validation rejects the request requiring a positive number

#### Scenario: Alert rule schema validates rule type and condition compatibility
- **WHEN** an alert rule creation request includes incompatible ruleType and condition combinations
- **THEN** Zod validation accepts valid combinations and provides clear type inference

### Requirement: Price Snapshot Schema Definition
The system SHALL define a Zod schema for PriceSnapshot entity that validates price data, availability status, and timestamp.

#### Scenario: Price snapshot schema validates availability enum
- **WHEN** a price snapshot includes an invalid availability value
- **THEN** Zod validation rejects the request with allowed availability values (in_stock, low_stock, out_of_stock)

#### Scenario: Price snapshot schema validates numeric fields
- **WHEN** a price snapshot includes a negative price value
- **THEN** Zod validation rejects the request requiring a positive number

### Requirement: Shared Schema Package Structure
The system SHALL organize schemas in a shared package that can be imported by both frontend and backend.

#### Scenario: Backend imports shared schemas
- **WHEN** backend code imports from `@shared/schemas`
- **THEN** TypeScript resolves the path correctly and provides full type inference

#### Scenario: Frontend imports shared schemas
- **WHEN** frontend code imports from `@shared/schemas`
- **THEN** TypeScript resolves the path correctly and provides full type inference

### Requirement: Schema Versioning
The system SHALL maintain schema definitions in a way that supports future versioning without breaking existing code.

#### Scenario: Schema exports types and validators
- **WHEN** a module imports a schema
- **THEN** both the Zod validator and inferred TypeScript types are available for use
