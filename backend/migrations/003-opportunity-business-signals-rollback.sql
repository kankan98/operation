-- ============================================================================
-- Opportunity Business Signals - rollback migration
-- Migration: 003-opportunity-business-signals
-- Description: Remove merchant-provided product business assumptions.
-- ============================================================================

BEGIN TRANSACTION;

DROP INDEX IF EXISTS idx_product_business_signals_updated_at;
DROP TABLE IF EXISTS product_business_signals;

COMMIT;
