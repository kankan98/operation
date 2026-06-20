## ADDED Requirements

### Requirement: Respect queue backend capacity
The scheduler SHALL respect configured queue backend capacity and worker availability when enqueueing and processing acquisition work.

#### Scenario: Queue backend healthy
- **WHEN** scheduled acquisition runs and the queue backend is healthy
- **THEN** the scheduler SHALL enqueue due monitoring products and allow workers to process due jobs up to configured capacity

#### Scenario: Queue backend degraded
- **WHEN** queue health is degraded because backlog or stale workers exceed thresholds
- **THEN** the scheduler SHALL continue safe enqueueing but SHALL avoid increasing worker processing beyond configured limits

#### Scenario: Queue backend unavailable
- **WHEN** the selected queue backend is unavailable
- **THEN** the scheduler SHALL record operational failure and avoid dropping due acquisition jobs silently

### Requirement: Respect provider operational gates
The scheduler SHALL respect provider rate-limit, quota, and fallback concurrency gates.

#### Scenario: Skip rate-limited provider
- **WHEN** a provider has an active rate-limit or quota gate
- **THEN** the scheduler SHALL not claim jobs for that provider until the reset time unless explicitly overridden by configuration

#### Scenario: Continue unaffected providers
- **WHEN** one provider is gated but other providers are healthy
- **THEN** the scheduler SHALL continue processing jobs for unaffected providers

### Requirement: Emit scheduler operations telemetry
The scheduler SHALL emit bounded operational telemetry for queue and worker decisions.

#### Scenario: Scheduled run summary
- **WHEN** scheduled acquisition finishes a cycle
- **THEN** the scheduler SHALL record enqueued count, claimed count, skipped count, gated provider count, failed count, and duration

#### Scenario: Manual run summary
- **WHEN** manual scheduler trigger runs
- **THEN** the scheduler SHALL record queue backend, created jobs, reused jobs, throttled jobs, and processing outcome
