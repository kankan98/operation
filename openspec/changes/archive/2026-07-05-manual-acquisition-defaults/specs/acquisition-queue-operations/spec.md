## MODIFIED Requirements

### Requirement: Select acquisition queue backend
The system SHALL keep the SQLite acquisition queue backend as local compatibility plumbing for manual checks, diagnostics, and existing job history; distributed queue backends are out of the manual-first default path.

#### Scenario: Use SQLite backend by default
- **WHEN** no acquisition queue backend is configured
- **THEN** the system SHALL process explicit acquisition jobs through the SQLite-backed queue adapter using existing durable job and attempt tables

#### Scenario: Distributed backend is not a default workflow
- **WHEN** the system runs in manual-first default configuration
- **THEN** it SHALL NOT require Redis, BullMQ, background workers, or distributed queue infrastructure to support product research workflows

#### Scenario: Preserve existing queue history
- **WHEN** queue operations are treated as diagnostics or compatibility plumbing
- **THEN** existing job, attempt, worker, provider gate, and queue event records SHALL remain readable for audit and troubleshooting

### Requirement: Report queue health
The system SHALL expose queue health summaries for acquisition operations as optional diagnostics and SHALL indicate whether queue operations are visible in the current configuration.

#### Scenario: Healthy queue state
- **WHEN** queue backlog, running jobs, retry-scheduled jobs, stale leases, and worker heartbeats are within configured thresholds
- **THEN** queue health SHALL return status `healthy` with current counts, timestamps, caveat, and visibility state

#### Scenario: Degraded queue state
- **WHEN** backlog, stale workers, failed jobs, retry pressure, or provider throttling exceeds configured thresholds
- **THEN** queue health SHALL return status `degraded` with reasons, remediation recommendations, caveat, and visibility state

#### Scenario: Insufficient queue history
- **WHEN** no queue jobs or worker heartbeats exist for the requested scope
- **THEN** queue health SHALL return status `insufficient_history` instead of failing

#### Scenario: Hidden queue operations remain non-scoring metadata
- **WHEN** queue operations visibility is disabled
- **THEN** queue health SHALL remain separate from opportunity score, market signals, business assumptions, demand, sales, margin, ROI, and profitability evidence
