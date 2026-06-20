-- ============================================================================
-- Opportunity Business Signals - database migration
-- Migration: 003-opportunity-business-signals
-- Description: Add merchant-provided product business assumptions.
-- ============================================================================

BEGIN TRANSACTION;

CREATE TABLE IF NOT EXISTS product_business_signals (
  product_id TEXT PRIMARY KEY,
  currency TEXT NOT NULL,
  cost_basis REAL,
  inbound_shipping REAL,
  outbound_shipping REAL,
  fulfillment_fee REAL,
  platform_fee REAL,
  referral_fee_rate REAL CHECK(referral_fee_rate IS NULL OR (referral_fee_rate >= 0 AND referral_fee_rate <= 1)),
  advertising_cost REAL,
  tax_customs_buffer REAL,
  target_sell_price REAL,
  target_units INTEGER CHECK(target_units IS NULL OR target_units >= 0),
  notes TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_product_business_signals_updated_at
ON product_business_signals(updated_at DESC);

COMMIT;
