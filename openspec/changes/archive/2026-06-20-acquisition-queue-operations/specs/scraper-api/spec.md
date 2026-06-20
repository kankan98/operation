## ADDED Requirements

### Requirement: Expose acquisition queue health APIs
The scraper API SHALL expose queue and worker health for acquisition operations.

#### Scenario: Get queue health
- **WHEN** a client requests acquisition queue health
- **THEN** the API SHALL return backend, status, backlog counts, running counts, retry counts, failed counts, stale lease counts, worker summary, provider gate summary, recommendations, and caveat

#### Scenario: Get worker health
- **WHEN** a client requests acquisition worker health
- **THEN** the API SHALL return bounded worker status entries ordered by most recent heartbeat

#### Scenario: Filter health by platform or provider
- **WHEN** queue health is requested with platform or provider filters
- **THEN** the API SHALL return only matching queue, job, and provider operational state

### Requirement: Expose bounded product job diagnostics
The scraper API SHALL expose product-specific acquisition job diagnostics.

#### Scenario: Product has active job
- **WHEN** a product has a pending, running, retry-scheduled, failed, or cancelled acquisition job
- **THEN** the API SHALL return job status, priority, attempt count, max attempts, next run time, lease owner, lease expiry, last attempt, last failure reason, and queue caveat

#### Scenario: Product has no job
- **WHEN** a product has no acquisition job history
- **THEN** the API SHALL return an empty job state instead of failing

### Requirement: Expose safe job control APIs
The scraper API SHALL expose bounded retry and cancel actions for acquisition jobs.

#### Scenario: Retry failed job
- **WHEN** a client requests retry for a failed or cancelled acquisition job
- **THEN** the API SHALL move the job to a claimable state and return the updated job status

#### Scenario: Cancel pending job
- **WHEN** a client requests cancellation for a pending or retry-scheduled job
- **THEN** the API SHALL mark the job cancelled and return the updated job status

#### Scenario: Reject unsafe job control
- **WHEN** a client requests an unsupported job control action
- **THEN** the API SHALL return validation feedback without mutating job state
