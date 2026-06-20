## ADDED Requirements

### Requirement: Route acquisition through queue operations
Product data acquisition SHALL route scheduled and manual jobs through the acquisition queue operations layer.

#### Scenario: Enqueue through queue adapter
- **WHEN** a product acquisition job is created
- **THEN** the system SHALL enqueue through the configured queue adapter and persist durable job metadata

#### Scenario: Claim through queue adapter
- **WHEN** a worker processes due acquisition work
- **THEN** the worker SHALL claim jobs through the configured queue adapter and respect lease, backend, provider, and retry constraints

#### Scenario: Preserve attempt provenance
- **WHEN** acquisition succeeds or fails through any queue backend
- **THEN** the system SHALL persist scrape attempts with provider, source, status, duration, confidence, failure reason, safe diagnostics, and attempt timestamp

### Requirement: Preserve multi-worker job safety
Product data acquisition SHALL prevent duplicate live processing of the same active job across workers.

#### Scenario: Prevent duplicate claim
- **WHEN** two workers attempt to claim the same due job
- **THEN** only one worker SHALL receive the running lease for that job

#### Scenario: Recover expired lease
- **WHEN** a running job lease expires because a worker stopped heartbeating
- **THEN** the job SHALL become eligible for retry according to retry and provider-limit rules

#### Scenario: Idempotent completion
- **WHEN** a worker completes a job whose lease is no longer current
- **THEN** the system SHALL avoid overwriting newer job state and SHALL preserve the attempt record for diagnostics

### Requirement: Throttle manual acquisition
Manual product acquisition SHALL be bounded so repeated refreshes do not overwhelm providers or queues.

#### Scenario: Manual refresh within throttle window
- **WHEN** a user requests a manual product check while a recent manual job is pending, running, or inside the throttle window
- **THEN** the system SHALL return the existing job or a throttled response instead of creating duplicate provider work

#### Scenario: Manual refresh after throttle window
- **WHEN** the throttle window has elapsed and provider limits allow work
- **THEN** the system SHALL enqueue a new manual acquisition job
