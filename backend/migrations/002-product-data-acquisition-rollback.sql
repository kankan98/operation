-- ============================================================================
-- Product Data Acquisition - rollback migration
-- Migration: 002-product-data-acquisition
-- Description: Remove persistent scrape jobs and scrape attempts.
-- ============================================================================

BEGIN TRANSACTION;

DROP INDEX IF EXISTS idx_scrape_attempts_job;
DROP INDEX IF EXISTS idx_scrape_attempts_product_timestamp;
DROP TABLE IF EXISTS scrape_attempts;

DROP INDEX IF EXISTS idx_scrape_jobs_product_active;
DROP INDEX IF EXISTS idx_scrape_jobs_status_next_run;
DROP TABLE IF EXISTS scrape_jobs;

COMMIT;
