## Why

Production Playwright auditing of the product-detail opportunity flow showed that known sell-price diagnostics still leak internal signal keys such as `business_sellPrice` and `sellPrice` into the Chinese UI. These messages appear in the exact guidance merchants use to complete business assumptions, so the raw keys make the workflow harder to understand and regress the localized signal-label contract.

## What Changes

- Display `sellPrice` and `business_sellPrice` as the merchant-facing label `目标售价` in product-detail diagnostic text and missing-signal badges.
- Apply the same known-signal label to opportunity diagnostic text and missing-signal summaries, because that page uses the same business signal vocabulary.
- Preserve API payload field names, stored assumptions, scoring behavior, and business metric calculations.
- Cover the behavior with targeted frontend tests and production Playwright smoke verification.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `product-detail-ui`: product detail must render known sell-price signal keys with readable Chinese labels rather than raw internal keys.
- `opportunity-business-signals`: opportunity and business-signal guidance must render known sell-price signal keys with readable Chinese labels rather than raw internal keys.

## Impact

- Frontend signal label mappings in ProductDetail and Opportunities.
- ProductDetail and Opportunities tests covering diagnostic text and missing-signal badge display.
- No backend API, schema, persistence, or scoring changes.
