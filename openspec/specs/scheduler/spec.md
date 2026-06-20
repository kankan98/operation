## Purpose

Scheduler coordinates periodic product acquisition work, manual triggering, retry processing, and failure isolation.
## Requirements
### Requirement: Start scheduler
The system SHALL allow starting the scheduler to run periodic scraping tasks.

#### Scenario: Start scheduler successfully
- **WHEN** start method is called
- **THEN** system SHALL initialize cron job to run every hour (0 * * * *)

#### Scenario: Prevent duplicate start
- **WHEN** start method is called when scheduler is already running
- **THEN** system SHALL throw error with message "Scheduler already running"

#### Scenario: Log scheduler start
- **WHEN** scheduler starts
- **THEN** system SHALL log "Scheduler started (runs every hour)"

### Requirement: Stop scheduler
The system SHALL allow stopping the scheduler.

#### Scenario: Stop running scheduler
- **WHEN** stop method is called on running scheduler
- **THEN** system SHALL stop cron job and set task to null

#### Scenario: Log scheduler stop
- **WHEN** scheduler stops
- **THEN** system SHALL log "Scheduler stopped"

#### Scenario: Handle stop when not running
- **WHEN** stop method is called when scheduler is not running
- **THEN** system SHALL do nothing (no error)

### Requirement: Check scheduler status
The system SHALL allow checking if scheduler is running.

#### Scenario: Return true when running
- **WHEN** isRunning method is called and scheduler is active
- **THEN** system SHALL return true

#### Scenario: Return false when not running
- **WHEN** isRunning method is called and scheduler is not active
- **THEN** system SHALL return false

### Requirement: Execute scheduled scraping
The system SHALL enqueue due acquisition jobs on schedule and process them without crashing the scheduler.

#### Scenario: Enqueue monitoring products on schedule
- **WHEN** cron job triggers
- **THEN** system SHALL enqueue acquisition jobs for monitoring products that are due for checking

#### Scenario: Process due acquisition jobs
- **WHEN** scheduled execution runs and due jobs exist
- **THEN** system SHALL process due jobs through the product data acquisition service

#### Scenario: Log scheduled execution
- **WHEN** scheduled scrape starts
- **THEN** system SHALL log "Scheduler: Starting scheduled scrape"

#### Scenario: Handle scraping errors
- **WHEN** scheduled acquisition fails for one product
- **THEN** system SHALL record the failed attempt and continue processing other due jobs

### Requirement: Manual trigger
The system SHALL allow manually triggering acquisition job enqueueing and processing outside of schedule.

#### Scenario: Trigger scraping now
- **WHEN** triggerNow method is called
- **THEN** system SHALL enqueue due monitoring products and process available acquisition jobs

#### Scenario: Log manual trigger
- **WHEN** manual trigger is executed
- **THEN** system SHALL log "Scheduler: Manual trigger"

### Requirement: Respect retry backoff
The scheduler SHALL respect retry backoff when selecting acquisition jobs to process.

#### Scenario: Skip job before next run time
- **WHEN** a failed job has a next run time in the future
- **THEN** scheduler SHALL not process that job yet

#### Scenario: Process job after next run time
- **WHEN** a failed job has a next run time at or before the current time
- **THEN** scheduler SHALL allow that job to be processed

### Requirement: Avoid overlapping job processing
The scheduler SHALL avoid processing the same scrape job concurrently.

#### Scenario: Skip running job
- **WHEN** a job is already marked running with an active lease
- **THEN** scheduler SHALL not claim the same job again

#### Scenario: Recover expired lease
- **WHEN** a running job lease has expired
- **THEN** scheduler SHALL allow the job to be retried according to retry rules

### Requirement: Production-only auto-start
The system SHALL only auto-start scheduler in production environment.

#### Scenario: Auto-start in production
- **WHEN** application starts and NODE_ENV is production
- **THEN** system SHALL automatically start scheduler

#### Scenario: No auto-start in development
- **WHEN** application starts and NODE_ENV is development
- **THEN** system SHALL NOT start scheduler automatically

### Requirement: Graceful shutdown
The system SHALL stop scheduler on application shutdown.

#### Scenario: Stop on SIGTERM
- **WHEN** SIGTERM signal is received
- **THEN** system SHALL stop scheduler before process exits

#### Scenario: Stop on SIGINT
- **WHEN** SIGINT signal is received
- **THEN** system SHALL stop scheduler before process exits

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

