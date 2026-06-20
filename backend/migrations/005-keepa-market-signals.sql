-- ============================================================================
-- Keepa Market Signals - database migration
-- Migration: 005-keepa-market-signals
-- Description: Add market signal snapshots and provider attempts.
-- ============================================================================

BEGIN TRANSACTION;

CREATE TABLE IF NOT EXISTS market_signal_snapshots (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL,
  platform TEXT NOT NULL,
  provider TEXT NOT NULL CHECK(provider IN ('keepa')),
  source TEXT NOT NULL CHECK(source IN ('third_party')),
  asin TEXT NOT NULL,
  marketplace TEXT NOT NULL,
  window_days INTEGER NOT NULL CHECK(window_days > 0),
  confidence REAL NOT NULL CHECK(confidence >= 0 AND confidence <= 1),
  freshness_ms INTEGER CHECK(freshness_ms IS NULL OR freshness_ms >= 0),
  price_trend TEXT,
  sales_rank_trend TEXT,
  review_velocity REAL,
  rating_movement REAL,
  missing_signals TEXT NOT NULL DEFAULT '[]',
  metadata TEXT,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (product_id) REFERENCES products(id)
);

CREATE INDEX IF NOT EXISTS idx_market_signal_snapshots_product_created
ON market_signal_snapshots(product_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_market_signal_snapshots_provider_created
ON market_signal_snapshots(provider, created_at DESC);

CREATE TABLE IF NOT EXISTS market_signal_attempts (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL,
  provider TEXT NOT NULL CHECK(provider IN ('keepa')),
  source TEXT NOT NULL CHECK(source IN ('third_party')),
  platform TEXT NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('success', 'failed')),
  failure_reason TEXT CHECK(failure_reason IS NULL OR failure_reason IN (
    'network_timeout',
    'not_found',
    'provider_unavailable',
    'unsupported_platform',
    'unsupported_product',
    'unknown'
  )),
  root_cause TEXT CHECK(root_cause IS NULL OR root_cause IN (
    'missing_credentials',
    'auth_failed',
    'quota_exhausted',
    'rate_limited',
    'insufficient_history',
    'network_timeout',
    'not_found',
    'unsupported_product',
    'unknown'
  )),
  error_message TEXT,
  duration_ms INTEGER NOT NULL CHECK(duration_ms >= 0),
  confidence REAL CHECK(confidence IS NULL OR (confidence >= 0 AND confidence <= 1)),
  http_status INTEGER,
  diagnostics TEXT,
  snapshot_id TEXT,
  timestamp INTEGER NOT NULL,
  FOREIGN KEY (product_id) REFERENCES products(id),
  FOREIGN KEY (snapshot_id) REFERENCES market_signal_snapshots(id)
);

CREATE INDEX IF NOT EXISTS idx_market_signal_attempts_product_timestamp
ON market_signal_attempts(product_id, timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_market_signal_attempts_provider_timestamp
ON market_signal_attempts(provider, timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_market_signal_attempts_status_timestamp
ON market_signal_attempts(status, timestamp DESC);

COMMIT;
