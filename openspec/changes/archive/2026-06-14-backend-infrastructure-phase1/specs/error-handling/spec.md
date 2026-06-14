## ADDED Requirements

### Requirement: Centralized error handling
The system SHALL provide a centralized error handling middleware that catches all errors.

#### Scenario: Handle application errors
- **WHEN** an AppError is thrown in a route handler
- **THEN** system SHALL return JSON response with error code, message, and appropriate HTTP status

#### Scenario: Handle unexpected errors
- **WHEN** an unexpected error occurs
- **THEN** system SHALL return 500 status with generic error message and log full error details

### Requirement: Structured error responses
The system SHALL return errors in a consistent JSON format.

#### Scenario: Error response format
- **WHEN** an error is returned to client
- **THEN** response SHALL contain error object with code and message fields

#### Scenario: Include status code in response
- **WHEN** an AppError is thrown
- **THEN** HTTP status code SHALL match the error's statusCode property

### Requirement: AppError class for known errors
The system SHALL provide an AppError class for throwing errors with specific status codes and error codes.

#### Scenario: Create AppError with custom code
- **WHEN** throwing an AppError with statusCode, message, and code
- **THEN** error handler SHALL use these values in the response

#### Scenario: Common error scenarios
- **WHEN** resource not found
- **THEN** system SHALL throw AppError with 404 status and appropriate code
- **WHEN** validation fails
- **THEN** system SHALL throw AppError with 400 status and VALIDATION_ERROR code
- **WHEN** duplicate resource
- **THEN** system SHALL throw AppError with 409 status and appropriate code

### Requirement: Error logging
The system SHALL log all errors with full stack traces.

#### Scenario: Log errors before responding
- **WHEN** error handler catches an error
- **THEN** system SHALL log error details including stack trace before sending response to client
