-- ============================================================================
-- Keepa Market Signals - rollback migration
-- Migration: 005-keepa-market-signals-rollback
-- Description: Remove market signal snapshots and provider attempts.
-- ============================================================================

BEGIN TRANSACTION;

DROP INDEX IF EXISTS idx_market_signal_attempts_status_timestamp;
DROP INDEX IF EXISTS idx_market_signal_attempts_provider_timestamp;
DROP INDEX IF EXISTS idx_market_signal_attempts_product_timestamp;
DROP TABLE IF EXISTS market_signal_attempts;

DROP INDEX IF EXISTS idx_market_signal_snapshots_provider_created;
DROP INDEX IF EXISTS idx_market_signal_snapshots_product_created;
DROP TABLE IF EXISTS market_signal_snapshots;

COMMIT;
