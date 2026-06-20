-- ============================================================================
-- eBay Browse Provider - rollback migration
-- Migration: 004-ebay-browse-provider-rollback
-- Description: Restore scrape_attempts source constraint before official_api.
-- ============================================================================

BEGIN TRANSACTION;

PRAGMA foreign_keys=off;

CREATE TABLE IF NOT EXISTS scrape_attempts_rollback (
  id TEXT PRIMARY KEY,
  job_id TEXT,
  product_id TEXT NOT NULL,
  provider TEXT NOT NULL,
  source TEXT NOT NULL CHECK(source IN ('api', 'third_party', 'browser', 'cache', 'mock')),
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

INSERT INTO scrape_attempts_rollback (
  id,
  job_id,
  product_id,
  provider,
  source,
  status,
  failure_reason,
  error_message,
  duration_ms,
  confidence,
  http_status,
  page_title,
  final_url,
  diagnostics,
  timestamp
)
SELECT
  id,
  job_id,
  product_id,
  provider,
  CASE WHEN source = 'official_api' THEN 'api' ELSE source END,
  status,
  failure_reason,
  error_message,
  duration_ms,
  confidence,
  http_status,
  page_title,
  final_url,
  diagnostics,
  timestamp
FROM scrape_attempts;

DROP TABLE scrape_attempts;
ALTER TABLE scrape_attempts_rollback RENAME TO scrape_attempts;

CREATE INDEX IF NOT EXISTS idx_scrape_attempts_product_timestamp
ON scrape_attempts(product_id, timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_scrape_attempts_job
ON scrape_attempts(job_id);

PRAGMA foreign_keys=on;

COMMIT;
