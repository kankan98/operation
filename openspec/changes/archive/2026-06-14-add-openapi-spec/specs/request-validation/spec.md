## ADDED Requirements

### Requirement: Zod Validation Middleware
The system SHALL provide an Express middleware function that validates request bodies against Zod schemas.

#### Scenario: Middleware validates request body
- **WHEN** a request is received by an endpoint with validation middleware
- **THEN** the request body is validated against the configured Zod schema before reaching the route handler

#### Scenario: Valid request passes through
- **WHEN** a request body matches the Zod schema
- **THEN** the validated and parsed data is assigned to req.body and the next middleware is called

#### Scenario: Invalid request is rejected
- **WHEN** a request body fails Zod validation
- **THEN** a 400 error response is returned with detailed Zod error information before reaching the route handler

### Requirement: Query Parameter Validation
The system SHALL provide a middleware function that validates query parameters against Zod schemas.

#### Scenario: Middleware validates query parameters
- **WHEN** a request is received with query parameters and query validation middleware
- **THEN** the query parameters are validated against the configured Zod schema

#### Scenario: Type coercion for query parameters
- **WHEN** query parameters are validated
- **THEN** string values are coerced to appropriate types (numbers, booleans) based on the schema

### Requirement: Validation Error Format
The system SHALL return structured validation errors in a consistent format.

#### Scenario: Validation error includes field paths
- **WHEN** request validation fails
- **THEN** the error response includes the field path for each validation error (e.g., "title", "currentPrice")

#### Scenario: Validation error includes error messages
- **WHEN** request validation fails
- **THEN** the error response includes human-readable messages for each validation error

#### Scenario: Validation error uses AppError format
- **WHEN** request validation fails
- **THEN** the error is thrown as an AppError with code "VALIDATION_ERROR" and status 400

### Requirement: Async Validation Support
The system SHALL support asynchronous Zod schema validation including async refinements.

#### Scenario: Async schema validation
- **WHEN** a Zod schema includes async refinements (e.g., checking database uniqueness)
- **THEN** the middleware awaits validation completion before proceeding

### Requirement: Middleware Composition
The system SHALL allow validation middleware to be easily composed with other Express middleware.

#### Scenario: Validation middleware chains with route handlers
- **WHEN** validation middleware is added to a route
- **THEN** it integrates seamlessly with other middleware and route handlers using Express's next() pattern

### Requirement: TypeScript Type Inference
The system SHALL provide TypeScript type inference for validated request bodies.

#### Scenario: Request body has inferred types
- **WHEN** validation middleware is applied with a Zod schema
- **THEN** req.body is automatically typed as the inferred schema type in the route handler

### Requirement: Validation Bypass for Development
The system SHALL allow validation to be optionally logged without blocking requests in development mode.

#### Scenario: Development mode validation warnings
- **WHEN** validation is configured for development mode
- **THEN** validation failures are logged but requests proceed to the handler

### Requirement: Custom Error Handler Integration
The system SHALL integrate with the existing AppError and errorHandler middleware.

#### Scenario: Validation errors flow through error handler
- **WHEN** validation fails and throws an AppError
- **THEN** the existing errorHandler middleware processes it consistently with other errors
