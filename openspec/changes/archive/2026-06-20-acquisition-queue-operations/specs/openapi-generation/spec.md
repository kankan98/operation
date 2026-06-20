## ADDED Requirements

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
