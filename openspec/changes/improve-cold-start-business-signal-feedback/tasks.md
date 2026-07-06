## 1. Backend Price-Stats Cold Start

- [x] 1.1 Add a failing backend test for `GET /api/analysis/price-stats/:productId` returning 200 empty stats for an existing product with no snapshots.
- [x] 1.2 Implement the HTTP-boundary empty price-stats response while preserving service-level `NO_PRICE_DATA` behavior for internal callers.

## 2. Product Detail Business-Signal UX

- [x] 2.1 Add failing product detail tests for no-snapshot stats rendering, referral rate percentage normalization, and business assumption save success feedback.
- [x] 2.2 Implement missing-data price stat rendering, referral rate help/normalization, and aria-live business assumption save feedback.

## 3. End-to-End Verification

- [x] 3.1 Extend the cold-start Playwright flow to cover percentage-style referral fee entry and business assumption save feedback.
- [x] 3.2 Run OpenSpec validation, targeted tests, lint/build checks, and a production-style Playwright smoke before commit/deploy.
