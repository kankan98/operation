-- ============================================================================
-- Acquisition Queue Operations - database migration
-- Migration: 007-acquisition-queue-operations
-- Description: Add worker heartbeat, provider gate, and queue operation tables.
-- ============================================================================

CREATE TABLE IF NOT EXISTS acquisition_queue_workers (
  worker_id TEXT PRIMARY KEY,
  backend TEXT NOT NULL CHECK(backend IN ('sqlite', 'bullmq')),
  status TEXT NOT NULL CHECK(status IN ('starting', 'idle', 'busy', 'stopping', 'stopped', 'stale')),
  concurrency INTEGER NOT NULL CHECK(concurrency > 0),
  active_job_count INTEGER NOT NULL DEFAULT 0 CHECK(active_job_count >= 0),
  queues_json TEXT NOT NULL DEFAULT '[]' CHECK(json_valid(queues_json)),
  started_at INTEGER NOT NULL,
  last_heartbeat_at INTEGER NOT NULL,
  metadata TEXT CHECK(metadata IS NULL OR json_valid(metadata)),
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_acquisition_queue_workers_heartbeat
ON acquisition_queue_workers(last_heartbeat_at DESC);

CREATE INDEX IF NOT EXISTS idx_acquisition_queue_workers_backend_status
ON acquisition_queue_workers(backend, status);

CREATE TABLE IF NOT EXISTS acquisition_provider_limits (
  id TEXT PRIMARY KEY,
  platform TEXT NOT NULL,
  provider TEXT NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('open', 'rate_limited', 'quota_exhausted', 'unavailable', 'disabled')),
  reset_at INTEGER,
  current_concurrency INTEGER NOT NULL DEFAULT 0 CHECK(current_concurrency >= 0),
  max_concurrency INTEGER NOT NULL DEFAULT 1 CHECK(max_concurrency > 0),
  active_count INTEGER NOT NULL DEFAULT 0 CHECK(active_count >= 0),
  recent_root_causes_json TEXT NOT NULL DEFAULT '[]' CHECK(json_valid(recent_root_causes_json)),
  recommendations_json TEXT NOT NULL DEFAULT '[]' CHECK(json_valid(recommendations_json)),
  metadata TEXT CHECK(metadata IS NULL OR json_valid(metadata)),
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  UNIQUE(platform, provider)
);

CREATE INDEX IF NOT EXISTS idx_acquisition_provider_limits_status
ON acquisition_provider_limits(status, reset_at);

CREATE TABLE IF NOT EXISTS acquisition_queue_events (
  id TEXT PRIMARY KEY,
  job_id TEXT,
  product_id TEXT,
  action TEXT NOT NULL,
  status TEXT NOT NULL,
  worker_id TEXT,
  platform TEXT,
  provider TEXT,
  message TEXT,
  metadata TEXT CHECK(metadata IS NULL OR json_valid(metadata)),
  timestamp INTEGER NOT NULL,
  FOREIGN KEY (job_id) REFERENCES scrape_jobs(id),
  FOREIGN KEY (product_id) REFERENCES products(id)
);

CREATE INDEX IF NOT EXISTS idx_acquisition_queue_events_job_timestamp
ON acquisition_queue_events(job_id, timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_acquisition_queue_events_product_timestamp
ON acquisition_queue_events(product_id, timestamp DESC);
