-- ============================================================================
-- Products Query Optimization - rollback migration
-- Migration: 008-products-query-optimization-rollback
-- Description: Remove indexes added for products query optimization
-- ============================================================================

DROP INDEX IF EXISTS idx_products_platform;
DROP INDEX IF EXISTS idx_products_is_monitoring;
DROP INDEX IF EXISTS idx_products_platform_is_monitoring;
