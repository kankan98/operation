## ADDED Requirements

### Requirement: Define acquisition queue operation schemas
The shared schema package SHALL define reusable queue operation schemas and inferred types.

#### Scenario: Validate queue health response
- **WHEN** a queue health response is returned
- **THEN** shared schemas SHALL validate backend, status, backlog counts, job counts, worker summary, provider gate summary, recommendations, caveat, and timestamp

#### Scenario: Validate worker heartbeat
- **WHEN** a worker heartbeat is recorded or returned
- **THEN** shared schemas SHALL validate worker ID, backend, status, concurrency, active job count, queues, timestamps, and safe metadata

#### Scenario: Validate product job diagnostics
- **WHEN** product job diagnostics are returned
- **THEN** shared schemas SHALL validate nullable job state, attempt summary, retry timing, lease fields, provider gate context, and caveat

### Requirement: Define queue job control schemas
The shared schema package SHALL define request and response schemas for acquisition job control.

#### Scenario: Validate retry request
- **WHEN** a retry request is submitted
- **THEN** shared schemas SHALL validate job ID, optional reason, and bounded operator note

#### Scenario: Validate cancel request
- **WHEN** a cancel request is submitted
- **THEN** shared schemas SHALL validate job ID, cancellation reason, and bounded operator note

#### Scenario: Validate provider limit state
- **WHEN** provider operational limit state is returned
- **THEN** shared schemas SHALL validate platform, provider, status, reset time, concurrency, active count, recent root causes, and recommendations

### Requirement: Preserve queue diagnostic safety
The shared schema package SHALL reject unsafe queue diagnostic fields.

#### Scenario: Reject secret diagnostics
- **WHEN** queue diagnostics include Redis URL credentials, API keys, authorization headers, cookies, raw provider payload, or raw HTML
- **THEN** shared schema tests SHALL fail unless those values are redacted or omitted
