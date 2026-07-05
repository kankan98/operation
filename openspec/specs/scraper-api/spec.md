## Purpose

Scraper API exposes manual and queued product data acquisition endpoints plus job and attempt diagnostics.
## Requirements
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

### Requirement: Create price snapshot on successful scrape
The system SHALL create a price snapshot record when scraping succeeds.

#### Scenario: Create snapshot with scraped data
- **WHEN** product is scraped successfully
- **THEN** system SHALL call PriceSnapshotService to create snapshot with productId, price, currency, availability, rating, and reviewCount

#### Scenario: Return snapshot ID in result
- **WHEN** snapshot is created
- **THEN** system SHALL include snapshotId in the scrape result

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

### Requirement: Support manual eBay product acquisition
The scraper API SHALL support manual acquisition for monitored eBay products through the existing product scrape endpoint.

#### Scenario: Scrape eBay product successfully
- **WHEN** POST `/api/scraper/product/:productId` is called for a valid eBay product and Browse API acquisition succeeds
- **THEN** the response SHALL include success=true, snapshotId, provider `ebay-browse`, source `official_api`, confidence, attemptId, and normalized product data

#### Scenario: Return eBay acquisition failure
- **WHEN** eBay acquisition fails for a valid product
- **THEN** the response SHALL include success=false, provider `ebay-browse`, source `official_api`, failureReason, attemptId when available, and a safe diagnostic summary

### Requirement: Expose eBay provider health API
The scraper API SHALL expose provider health for platform `ebay` using the existing provider health response contract.

#### Scenario: Query eBay health endpoint
- **WHEN** a client requests eBay provider health
- **THEN** the API SHALL return status, provider summaries, chain summary, latest attempts, and recommendations for platform `ebay`

#### Scenario: Filter eBay health by product
- **WHEN** a product ID is provided to the eBay health query
- **THEN** the API SHALL scope latest attempts and chain outcomes to that product

#### Scenario: Validate eBay health query
- **WHEN** eBay health query parameters are invalid
- **THEN** the API SHALL return validation errors using existing error response conventions

