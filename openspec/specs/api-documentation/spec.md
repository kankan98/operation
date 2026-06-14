# API Documentation

## Purpose

This capability defines the standards for documenting the project's APIs — RESTful endpoints, SSE streaming endpoints, error codes, versioning, rate limiting, future WebSocket support, client examples, and API testing — so that every endpoint is consistently and completely documented for consumers and maintainers.

## Requirements

### Requirement: RESTful API Documentation
The system SHALL maintain comprehensive API documentation for all RESTful endpoints including request/response formats, authentication, and examples.

#### Scenario: All endpoints are documented
- **WHEN** creating or modifying an API endpoint
- **THEN** documentation MUST include: HTTP method and path, description of what the endpoint does, authentication requirements, request parameters (path/query/body), response format with example, and error responses with status codes

#### Scenario: Request parameters are detailed
- **WHEN** documenting endpoint parameters
- **THEN** each parameter MUST specify: name, type (string/number/boolean/object), whether required or optional, validation rules, and example value

#### Scenario: Response formats are standardized
- **WHEN** documenting API responses
- **THEN** success responses MUST show complete example JSON, error responses MUST list all possible error codes, pagination responses MUST show metadata format, and response fields MUST include type and description

#### Scenario: Authentication is documented
- **WHEN** documenting protected endpoints
- **THEN** documentation MUST explain: authentication mechanism (currently none, future: JWT), how to include credentials, token expiration, and error responses for authentication failures

### Requirement: SSE Streaming API Documentation
The system SHALL document Server-Sent Events (SSE) streaming endpoints including event types, connection management, and error handling.

#### Scenario: SSE endpoint behavior is documented
- **WHEN** using SSE streaming endpoints
- **THEN** documentation MUST explain: how to connect to SSE endpoint, event-stream content type requirement, automatic reconnection behavior (retry field), and how to handle client disconnection

#### Scenario: Event types are defined
- **WHEN** receiving SSE events
- **THEN** documentation MUST list all event types: start (connection established), processing (AI is thinking), text (streamed text chunk), tool_call (tool invocation), tool_result (tool output), usage (token usage), done (stream complete), and error (error occurred)

#### Scenario: Event format is standardized
- **WHEN** parsing SSE events
- **THEN** each event MUST be documented with: event name, data field JSON schema, when it occurs in the stream lifecycle, and example payload

#### Scenario: Error handling is documented
- **WHEN** SSE connection fails
- **THEN** documentation MUST explain: client-side retry strategy, server-side error events format, handling network interruptions, and debugging SSE with curl examples

### Requirement: Error Code Definitions
The system SHALL maintain a comprehensive list of error codes with descriptions and resolution guidance.

#### Scenario: HTTP status codes are defined
- **WHEN** API returns an error
- **THEN** status codes MUST follow standards: 400 (bad request - validation failed), 401 (unauthorized - auth required), 403 (forbidden - insufficient permissions), 404 (not found - resource doesn't exist), 500 (internal server error - unexpected failure), and 503 (service unavailable - dependency down)

#### Scenario: Custom error codes are documented
- **WHEN** returning application-specific errors
- **THEN** each error code MUST have: unique identifier, HTTP status code mapping, description of what caused the error, and suggested resolution steps

#### Scenario: Error response format is consistent
- **WHEN** returning error responses
- **THEN** all errors MUST follow format: status (HTTP status code), error (error type string), message (human-readable description), details (optional additional context), and requestId (for support debugging)

### Requirement: API Versioning Strategy
The system SHALL document the API versioning approach and backward compatibility policy.

#### Scenario: API version is communicated
- **WHEN** making API requests
- **THEN** current version MUST be documented (currently v1 implicit in /api prefix), version changes MUST be announced in advance, and breaking changes MUST increment major version

#### Scenario: Backward compatibility is defined
- **WHEN** modifying existing APIs
- **THEN** adding optional fields is backward compatible, changing required fields is breaking change, removing fields is breaking change, and changing response structure is breaking change

#### Scenario: Deprecation policy is documented
- **WHEN** deprecating API endpoints
- **THEN** deprecation MUST be announced at least 90 days in advance, deprecated endpoints MUST include Deprecation header, alternative endpoints MUST be documented, and timeline for removal MUST be specified

### Requirement: Rate Limiting Documentation
The system SHALL document rate limiting policies and how clients should handle rate limit errors.

#### Scenario: Rate limits are defined
- **WHEN** calling API endpoints
- **THEN** documentation MUST specify: requests per minute limit (currently unlimited, future: 100/min), rate limit scope (per IP, per user), and which endpoints are rate limited

#### Scenario: Rate limit headers are documented
- **WHEN** approaching rate limits
- **THEN** responses SHOULD include: X-RateLimit-Limit (max requests), X-RateLimit-Remaining (requests left), X-RateLimit-Reset (when limit resets), and 429 status when exceeded

#### Scenario: Client retry strategy is recommended
- **WHEN** rate limit is exceeded
- **THEN** documentation MUST recommend: exponential backoff for retries, respecting Retry-After header, and implementing client-side rate limiting

### Requirement: WebSocket API Documentation (Future)
The system SHALL prepare documentation structure for future WebSocket real-time features.

#### Scenario: WebSocket endpoints are documented
- **WHEN** WebSocket support is added
- **THEN** documentation MUST include: connection URL and protocol, authentication handshake, message format (JSON), keepalive/ping-pong mechanism, and graceful disconnection

#### Scenario: Message types are defined
- **WHEN** sending/receiving WebSocket messages
- **THEN** each message type MUST document: message type identifier, payload schema, direction (client-to-server or server-to-client), and example messages

### Requirement: API Client Examples
The system SHALL provide code examples for common API operations in multiple languages.

#### Scenario: JavaScript/TypeScript examples are provided
- **WHEN** developers integrate the API
- **THEN** examples MUST show: making basic requests with fetch/axios, handling SSE streams with EventSource, error handling patterns, and TypeScript type definitions

#### Scenario: cURL examples are provided
- **WHEN** testing API endpoints
- **THEN** examples MUST show: basic GET/POST/PUT/DELETE requests, sending JSON payloads, handling authentication headers, and streaming SSE with curl -N

#### Scenario: Common workflows are demonstrated
- **WHEN** implementing typical use cases
- **THEN** examples MUST cover: creating and monitoring a product, setting up alert rules, streaming chat responses, and handling pagination

### Requirement: API Testing Documentation
The system SHALL document how to test API endpoints including integration tests and manual testing approaches.

#### Scenario: Integration test examples are provided
- **WHEN** writing API tests
- **THEN** documentation MUST show: setting up test database, making test requests with supertest, asserting response structure, and cleaning up test data

#### Scenario: Postman collection is available
- **WHEN** manually testing APIs
- **THEN** a Postman collection SHOULD be provided with: all endpoints configured, environment variables for base URL, example requests with valid payloads, and test assertions
