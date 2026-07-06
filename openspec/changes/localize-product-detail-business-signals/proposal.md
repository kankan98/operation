## Why

Production Playwright auditing of the product-detail cold-start flow showed that the Chinese UI still exposes English business labels and backend/internal signal keys in the business assumptions section. Examples include `Cost basis`, `Inbound shipping`, `Referral rate`, `Net margin`, and `business_costBasis`. These labels appear exactly where merchants decide what cost, shipping, fee, advertising, tax, and target price assumptions to enter, so the mismatch slows down the core ecommerce operations workflow.

## What Changes

- Display merchant-facing Chinese labels for product-detail business metrics and business assumption inputs.
- Render business and opportunity missing-signal badges with readable labels instead of raw internal keys when a known mapping exists.
- Preserve API payload fields, persistence, validation, ROI/margin formulas, and opportunity scoring behavior.
- Cover the display contract with ProductDetail tests and verify the production workflow with Playwright.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `product-detail-ui`: product detail should present business assumptions and missing-signal guidance using user-facing labels in the active Chinese UI rather than raw internal keys.
- `opportunity-business-signals`: business assumption UI labels should identify the merchant input expected without changing persisted field names or metric calculations.

## Impact

- Frontend ProductDetail display labels and tests.
- OpenSpec documentation for product detail and business signals.
