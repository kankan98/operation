## Why

Playwright auditing of the live cold-start flow found that newly added products without snapshots trigger noisy 404 price-stat requests, and the business assumptions form lets users enter ambiguous referral fee values that can fail validation without actionable guidance. These issues make the first product research loop feel brittle exactly when users need clear next steps.

## What Changes

- Return or present an empty price-stat state for products that exist but do not yet have price snapshots, without surfacing 404 errors for the expected cold-start case.
- Clarify referral fee input semantics in the product detail business assumptions form and accept common percentage-style input where practical.
- Show a visible success state after business assumptions are saved so users know their research inputs were accepted.
- Keep opportunity scoring and market-signal caveats unchanged; this change only improves cold-start completion and feedback.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `price-analysis`: product price stats must support the existing-product/no-snapshots cold-start state without an error response.
- `opportunity-business-signals`: business assumption inputs must guide valid referral fee entry and acknowledge successful saves.
- `product-detail-ui`: product detail must present cold-start research inputs and save feedback clearly.

## Impact

- Backend price stats service/route behavior for products with zero snapshots.
- Frontend product detail business assumptions form labels, validation/conversion, and save feedback.
- Unit/component tests and the cold-start Playwright flow.
