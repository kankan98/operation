## MODIFIED Requirements

### Requirement: Scrape all monitoring products
The system SHALL keep bulk monitoring acquisition behind an explicit configuration flag so manual-first installations do not enqueue provider work by default.

#### Scenario: Bulk acquisition disabled by default
- **WHEN** POST request to `/api/scraper/all` is made and bulk acquisition is not explicitly enabled
- **THEN** the system SHALL return a structured disabled response with `enabled=false`, zero queued jobs, and a caveat explaining manual-first mode

#### Scenario: Queue all monitoring products when explicitly enabled
- **WHEN** POST request to `/api/scraper/all` is made and bulk acquisition is explicitly enabled
- **THEN** system SHALL enqueue acquisition jobs for due products where `isMonitoring=true` and return 200 status with queued count

#### Scenario: Return detailed results
- **WHEN** enabled bulk acquisition is triggered
- **THEN** system SHALL return total count, queued count, skipped count, and array of job references

#### Scenario: Avoid duplicate queued jobs
- **WHEN** a monitoring product already has a pending or running acquisition job
- **THEN** system SHALL not create a duplicate job for the same product

### Requirement: Expose acquisition queue health APIs
The scraper API SHALL expose queue and worker health as optional operational diagnostics for acquisition operations, not as the default manual-first user workflow.

#### Scenario: Get queue health
- **WHEN** a client requests acquisition queue health
- **THEN** the API SHALL return backend, status, backlog counts, running counts, retry counts, failed counts, stale lease counts, worker summary, provider gate summary, recommendations, caveat, and whether queue operations are intended to be visible in the current configuration

#### Scenario: Get worker health
- **WHEN** a client requests acquisition worker health
- **THEN** the API SHALL return bounded worker status entries ordered by most recent heartbeat

#### Scenario: Filter health by platform or provider
- **WHEN** queue health is requested with platform or provider filters
- **THEN** the API SHALL return only matching queue, job, and provider operational state
