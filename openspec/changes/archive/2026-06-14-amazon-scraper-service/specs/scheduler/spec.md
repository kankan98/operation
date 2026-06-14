## ADDED Requirements

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
The system SHALL execute scraping tasks on schedule.

#### Scenario: Scrape all monitoring products on schedule
- **WHEN** cron job triggers (every hour)
- **THEN** system SHALL call ScraperService.scrapeAllMonitoringProducts()

#### Scenario: Log scheduled execution
- **WHEN** scheduled scrape starts
- **THEN** system SHALL log "Scheduler: Starting scheduled scrape"

#### Scenario: Handle scraping errors
- **WHEN** scheduled scrape fails
- **THEN** system SHALL log error and continue running (not crash)

### Requirement: Manual trigger
The system SHALL allow manually triggering scraping outside of schedule.

#### Scenario: Trigger scraping now
- **WHEN** triggerNow method is called
- **THEN** system SHALL immediately call ScraperService.scrapeAllMonitoringProducts()

#### Scenario: Log manual trigger
- **WHEN** manual trigger is executed
- **THEN** system SHALL log "Scheduler: Manual trigger"

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
