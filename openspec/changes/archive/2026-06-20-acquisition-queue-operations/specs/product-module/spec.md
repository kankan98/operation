## ADDED Requirements

### Requirement: Show queue operations in opportunity workbench
The opportunity workbench SHALL show acquisition queue operations state separately from opportunity score and research metadata.

#### Scenario: Display queue health summary
- **WHEN** opportunity results include queue or product job diagnostics
- **THEN** each affected opportunity row SHALL show operational status such as delayed, retrying, rate-limited, stale worker, or healthy

#### Scenario: Keep score separate
- **WHEN** queue operations state is degraded
- **THEN** the workbench SHALL keep opportunity score, business signals, market signals, and research metadata visually and semantically separate from queue state

#### Scenario: Explain check-data recommendation
- **WHEN** an opportunity recommends `check_data` because acquisition data is stale or missing
- **THEN** the workbench SHALL include queue/job context so the user can distinguish missing data from weak product opportunity

### Requirement: Filter opportunities by operational state
The opportunity workbench SHALL allow users to identify opportunities blocked by acquisition operations.

#### Scenario: Filter delayed acquisition
- **WHEN** the user filters for delayed or blocked acquisition
- **THEN** the workbench SHALL show opportunities whose latest job is delayed by retry backoff, worker health, provider gate, or queue backlog

#### Scenario: Filter actionable retry
- **WHEN** the user filters for retryable acquisition jobs
- **THEN** the workbench SHALL show opportunities with failed or cancelled jobs that can be retried through supported controls
