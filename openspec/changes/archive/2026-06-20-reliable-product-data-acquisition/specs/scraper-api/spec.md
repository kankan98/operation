## MODIFIED Requirements

### Requirement: Scrape single product
The system SHALL allow manual triggering of data acquisition for a single product and return structured job/acquisition information.

#### Scenario: Scrape product successfully
- **WHEN** POST request to /api/scraper/product/:productId with valid product ID completes successfully
- **THEN** system SHALL acquire product data, create snapshot, and return 200 status with success=true, snapshotId, provider, source, confidence, and attemptId

#### Scenario: Return error for non-existent product
- **WHEN** POST request to /api/scraper/product/:productId with non-existent product ID
- **THEN** system SHALL return 500 status with SCRAPE_FAILED error code

#### Scenario: Update product information after scraping
- **WHEN** scraping succeeds
- **THEN** system SHALL update product's currentPrice, lastCheckedAt, and optionally title and imageUrl

#### Scenario: Return structured acquisition failure
- **WHEN** product data acquisition fails for a valid product
- **THEN** system SHALL return success=false with productId, failureReason, provider, source, attemptId, and diagnostic summary

### Requirement: Scrape all monitoring products
The system SHALL allow manual triggering of acquisition jobs for all products marked as monitoring.

#### Scenario: Queue all monitoring products
- **WHEN** POST request to /api/scraper/all
- **THEN** system SHALL enqueue acquisition jobs for all products where isMonitoring=true and return 200 status with queued count

#### Scenario: Return detailed results
- **WHEN** scraping all products is triggered
- **THEN** system SHALL return total count, queued count, skipped count, and array of job references

#### Scenario: Avoid duplicate queued jobs
- **WHEN** a monitoring product already has a pending or running acquisition job
- **THEN** system SHALL not create a duplicate job for the same product

## ADDED Requirements

### Requirement: Query scrape attempts
The system SHALL expose scrape attempt history for diagnostics.

#### Scenario: Get attempts for product
- **WHEN** GET request to /api/scraper/product/:productId/attempts is made
- **THEN** system SHALL return recent attempts for that product ordered by most recent first

#### Scenario: Limit attempt history
- **WHEN** GET request includes a limit query parameter
- **THEN** system SHALL return at most that many attempts

### Requirement: Query scrape jobs
The system SHALL expose scrape job status for queued and running acquisition work.

#### Scenario: Get job status
- **WHEN** GET request to /api/scraper/jobs/:jobId is made
- **THEN** system SHALL return job status, product ID, attempt count, next run time, and last failure reason

#### Scenario: Return not found for unknown job
- **WHEN** GET request references an unknown scrape job
- **THEN** system SHALL return 404 status

