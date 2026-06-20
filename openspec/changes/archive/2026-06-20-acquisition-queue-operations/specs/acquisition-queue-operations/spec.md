## ADDED Requirements

### Requirement: Select acquisition queue backend
The system SHALL support a queue operations layer with SQLite as the default backend and BullMQ/Redis as an optional production backend.

#### Scenario: Use SQLite backend by default
- **WHEN** no acquisition queue backend is configured
- **THEN** the system SHALL process acquisition jobs through the SQLite-backed queue adapter using existing durable job and attempt tables

#### Scenario: Use BullMQ backend when configured
- **WHEN** `ACQUISITION_QUEUE_BACKEND` is `bullmq` and Redis configuration is valid
- **THEN** the system SHALL enqueue and claim acquisition work through the BullMQ adapter while preserving durable SQLite job and attempt provenance

#### Scenario: Reject unavailable BullMQ configuration
- **WHEN** BullMQ is selected but Redis configuration is missing or unreachable during startup checks
- **THEN** the system SHALL report queue backend unavailable and avoid silently falling back to a different backend in production

### Requirement: Track worker heartbeat and status
The system SHALL track acquisition worker heartbeat, capacity, current load, and stale-worker state.

#### Scenario: Record worker heartbeat
- **WHEN** an acquisition worker starts or sends a heartbeat
- **THEN** the system SHALL record worker ID, backend, status, concurrency, active job count, queues, last heartbeat timestamp, and safe metadata

#### Scenario: Mark stale worker
- **WHEN** a worker has not sent a heartbeat within the configured stale threshold
- **THEN** queue health SHALL mark the worker as stale and include remediation guidance

#### Scenario: Preserve safe worker metadata
- **WHEN** worker metadata is recorded or returned
- **THEN** it SHALL exclude secrets, Redis credentials, cookies, raw provider payloads, and high-cardinality free text

### Requirement: Report queue health
The system SHALL expose queue health summaries for acquisition operations.

#### Scenario: Healthy queue state
- **WHEN** queue backlog, running jobs, retry-scheduled jobs, stale leases, and worker heartbeats are within configured thresholds
- **THEN** queue health SHALL return status `healthy` with current counts and timestamps

#### Scenario: Degraded queue state
- **WHEN** backlog, stale workers, failed jobs, retry pressure, or provider throttling exceeds configured thresholds
- **THEN** queue health SHALL return status `degraded` with reasons and remediation recommendations

#### Scenario: Insufficient queue history
- **WHEN** no queue jobs or worker heartbeats exist for the requested scope
- **THEN** queue health SHALL return status `insufficient_history` instead of failing

### Requirement: Enforce provider operational limits
The system SHALL apply provider-level operational limits before claiming or executing acquisition work.

#### Scenario: Provider rate limited
- **WHEN** a provider is marked rate limited until a future reset time
- **THEN** the queue SHALL delay jobs for that provider without delaying unaffected providers

#### Scenario: Provider quota exhausted
- **WHEN** provider diagnostics indicate exhausted quota
- **THEN** queue health SHALL expose the quota state and scheduler SHALL stop claiming jobs for that provider until the reset or configuration changes

#### Scenario: Browser fallback concurrency limited
- **WHEN** browser fallback jobs are due
- **THEN** the system SHALL respect browser fallback concurrency limits so platform protection failures are not amplified by parallel retries

### Requirement: Control acquisition jobs safely
The system SHALL provide bounded job control actions that preserve durable history.

#### Scenario: Retry failed job
- **WHEN** an operator retries a failed or cancelled acquisition job
- **THEN** the system SHALL move the job to a claimable state, reset retry timing according to policy, and preserve prior attempts

#### Scenario: Cancel pending job
- **WHEN** an operator cancels a pending or retry-scheduled job
- **THEN** the system SHALL mark the job cancelled and prevent workers from claiming it

#### Scenario: Protect running job cancellation
- **WHEN** an operator cancels a running job and the backend does not support cooperative cancellation
- **THEN** the system SHALL record a cancellation request and rely on lease expiry or worker completion for final state

### Requirement: Keep queue state separate from opportunity signals
The system SHALL treat queue and worker state as data-source operations metadata, not product market or profitability evidence.

#### Scenario: Opportunity score unaffected
- **WHEN** queue backlog, worker health, provider throttling, or job state changes
- **THEN** opportunity score, score factors, business metrics, and market signal values SHALL NOT change because of queue state alone

#### Scenario: Queue caveat returned
- **WHEN** queue health is returned to API, UI, or Chat surfaces
- **THEN** the response SHALL include a caveat that queue health explains acquisition operations and is not evidence of sales, demand, margin, ROI, or profitability
