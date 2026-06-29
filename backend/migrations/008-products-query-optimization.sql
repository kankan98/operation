-- ============================================================================
-- Products Query Optimization - database migration
-- Migration: 008-products-query-optimization
-- Description: Add indexes on products table for query performance optimization
-- ============================================================================

-- Add index on platform column (used in WHERE clauses)
CREATE INDEX IF NOT EXISTS idx_products_platform
ON products(platform);

-- Add index on isMonitoring column (used in WHERE clauses)
CREATE INDEX IF NOT EXISTS idx_products_is_monitoring
ON products(is_monitoring);

-- Add composite index for common filter combinations
CREATE INDEX IF NOT EXISTS idx_products_platform_is_monitoring
ON products(platform, is_monitoring);
