## MODIFIED Requirements

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

## ADDED Requirements

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
