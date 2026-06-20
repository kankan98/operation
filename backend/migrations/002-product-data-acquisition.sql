-- ============================================================================
-- Product Data Acquisition - database migration
-- Migration: 002-product-data-acquisition
-- Description: Add persistent scrape jobs and scrape attempts.
-- ============================================================================

BEGIN TRANSACTION;

CREATE TABLE IF NOT EXISTS scrape_jobs (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('pending', 'running', 'succeeded', 'failed', 'retry_scheduled', 'cancelled')),
  priority INTEGER NOT NULL DEFAULT 0,
  next_run_at INTEGER NOT NULL,
  attempt_count INTEGER NOT NULL DEFAULT 0 CHECK(attempt_count >= 0),
  max_attempts INTEGER NOT NULL DEFAULT 3 CHECK(max_attempts > 0),
  last_attempt_id TEXT,
  last_failure_reason TEXT,
  lease_owner TEXT,
  lease_expires_at INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  completed_at INTEGER,
  metadata TEXT,
  FOREIGN KEY (product_id) REFERENCES products(id)
);

CREATE INDEX IF NOT EXISTS idx_scrape_jobs_status_next_run
ON scrape_jobs(status, next_run_at);

CREATE INDEX IF NOT EXISTS idx_scrape_jobs_product_active
ON scrape_jobs(product_id, status);

CREATE TABLE IF NOT EXISTS scrape_attempts (
  id TEXT PRIMARY KEY,
  job_id TEXT,
  product_id TEXT NOT NULL,
  provider TEXT NOT NULL,
  source TEXT NOT NULL CHECK(source IN ('api', 'third_party', 'official_api', 'browser', 'cache', 'mock')),
  status TEXT NOT NULL CHECK(status IN ('success', 'failed')),
  failure_reason TEXT,
  error_message TEXT,
  duration_ms INTEGER NOT NULL CHECK(duration_ms >= 0),
  confidence REAL CHECK(confidence IS NULL OR (confidence >= 0 AND confidence <= 1)),
  http_status INTEGER,
  page_title TEXT,
  final_url TEXT,
  diagnostics TEXT,
  timestamp INTEGER NOT NULL,
  FOREIGN KEY (job_id) REFERENCES scrape_jobs(id),
  FOREIGN KEY (product_id) REFERENCES products(id)
);

CREATE INDEX IF NOT EXISTS idx_scrape_attempts_product_timestamp
ON scrape_attempts(product_id, timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_scrape_attempts_job
ON scrape_attempts(job_id);

COMMIT;
