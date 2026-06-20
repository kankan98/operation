## 1. Data Model and Types

- [x] 1.1 Add acquisition provider, source, failure reason, job status, attempt status, and structured result types to backend shared types
- [x] 1.2 Add `scrape_jobs` and `scrape_attempts` tables to the Drizzle schema
- [x] 1.3 Create migration for scrape job and attempt tables with rollback migration
- [x] 1.4 Add acquisition configuration for provider order, browser fallback, retry limits, backoff, cache freshness, and diagnostic capture
- [x] 1.5 Update test database helpers to create scrape job and attempt tables

## 2. Job and Attempt Services

- [x] 2.1 Create ScrapeJobService for creating, updating, claiming, and completing scrape jobs
- [x] 2.2 Implement duplicate prevention for pending or running jobs per product
- [x] 2.3 Implement retry scheduling with exponential backoff and jitter
- [x] 2.4 Implement lease handling for running jobs and expired lease recovery
- [x] 2.5 Create ScrapeAttemptService for recording and querying provider attempts
- [x] 2.6 Add unit tests for job creation, duplicate prevention, claiming, retry, failure, success, and attempt history

## 3. Provider Architecture

- [x] 3.1 Create ProductDataProvider interface and shared acquisition result helpers
- [x] 3.2 Create ProductDataProviderRouter that selects provider chains by platform and config
- [x] 3.3 Add provider unavailable handling and fallback to the next provider in the chain
- [x] 3.4 Add cached fallback when prior product data is within the configured freshness window
- [x] 3.5 Add unit tests for provider routing, fallback ordering, unsupported platforms, provider failure, and cached fallback

## 4. Amazon Browser Provider

- [x] 4.1 Wrap the existing Amazon scraper as an `amazon-browser` ProductDataProvider
- [x] 4.2 Add Amazon page-state classification for robot check, captcha, blocked, geo restricted, not found, selector drift, and valid product page
- [x] 4.3 Add selector fallback groups for Amazon price, title, availability, rating, review count, and image fields
- [x] 4.4 Add diagnostic metadata capture for failed browser attempts without storing sensitive headers or cookies
- [x] 4.5 Update Amazon scraper tests to cover robot check, captcha, geo restriction, not found, selector drift, fallback selectors, and price missing

## 5. Acquisition Service Integration

- [x] 5.1 Refactor ScraperService to use scrape jobs, provider router, and attempt recording
- [x] 5.2 Preserve existing successful scrape behavior by creating price snapshots and updating products
- [x] 5.3 Store provider, source, confidence, and attempt ID in snapshot metadata
- [x] 5.4 Trigger alert evaluation only after successful live or accepted cached acquisition
- [x] 5.5 Add service tests for successful acquisition, structured failure, snapshot metadata, alert triggering, and cached fallback

## 6. Scraper API Updates

- [x] 6.1 Update POST `/api/scraper/product/:productId` to return structured acquisition result fields
- [x] 6.2 Update POST `/api/scraper/all` to enqueue jobs and return queued, skipped, and total counts
- [x] 6.3 Add GET `/api/scraper/product/:productId/attempts` for recent attempt history
- [x] 6.4 Add GET `/api/scraper/jobs/:jobId` for job status
- [x] 6.5 Update OpenAPI schemas for structured scraper responses, jobs, and attempts
- [x] 6.6 Add API integration tests for single scrape success, structured failure, bulk enqueue, duplicate prevention, attempt history, and job status

## 7. Scheduler Updates

- [x] 7.1 Update scheduled execution to enqueue monitoring products that are due for checking
- [x] 7.2 Add due job processing that respects retry backoff and active leases
- [x] 7.3 Update manual trigger to enqueue and process available acquisition jobs
- [x] 7.4 Ensure one product failure records an attempt and does not stop remaining scheduled work
- [x] 7.5 Add scheduler tests for due enqueueing, backoff skip, expired lease recovery, manual trigger, and failure isolation

## 8. Validation and Documentation

- [x] 8.1 Run backend lint and typecheck/build
- [x] 8.2 Run backend unit and API tests
- [x] 8.3 Run targeted scraper tests with mocked Amazon pages and no real Amazon network calls
- [x] 8.4 Document provider configuration and recommended first providers in backend environment documentation
- [x] 8.5 Run `openspec status --change reliable-product-data-acquisition` and confirm the change is apply-ready
