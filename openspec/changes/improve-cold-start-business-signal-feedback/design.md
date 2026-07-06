## Context

The live cold-start audit showed that a newly created product with no snapshots causes `GET /api/analysis/price-stats/:productId` to return 404 twice while the product detail page is otherwise usable. The same flow also showed that the business assumptions form exposes `Referral rate` without clarifying whether users should enter `0.12` or `12`, and a percentage-style value fails backend validation.

The current price analysis service is also used by alert evaluation and agent tools. Those internal callers rely on "no price data" being exceptional so they do not treat missing price history as a real zero price. The HTTP route and product detail UI can provide a friendlier cold-start state without changing those internal semantics.

## Goals / Non-Goals

**Goals:**

- Avoid 404 noise on the product detail page for existing products that simply have no price snapshots.
- Render no-snapshot price stats as a visible missing-data state, not as `$0.00`.
- Make referral fee entry clear and tolerant of common percentage input such as `12` for 12%.
- Show a visible save success message after business assumptions are accepted.

**Non-Goals:**

- Rework opportunity scoring weights, recommendation gates, or market-signal rules.
- Change alert-trigger behavior for products without price history.
- Add a multi-step onboarding wizard.
- Change the persisted representation of `referralFeeRate`; it remains a normalized decimal fraction from 0 to 1.

## Decisions

1. **Convert no-snapshot stats at the HTTP boundary.**
   - The analysis route will return a 200 response with `dataPoints: 0`, zero-valued numeric placeholders, and unknown provenance only when the product exists and the price analysis service reports `NO_PRICE_DATA`.
   - Internal service callers keep receiving the existing error so alerts and agent tools do not accidentally process missing prices as real prices.
   - Alternative considered: make `PriceStats` nullable everywhere. That would be more semantically exact but requires wider API/type changes for a narrow UI issue.

2. **Render `dataPoints: 0` as missing in product detail.**
   - The product detail price KPI section will display "暂无读数" / "缺失" style values for zero-data stats.
   - This keeps the response shape stable while preventing a misleading `$0.00` current price.

3. **Normalize percentage-style referral rate input in the UI.**
   - If users enter a value greater than 1 and up to 100, the form will submit `value / 100`.
   - Values already between 0 and 1 submit unchanged.
   - The label/help text will state the accepted forms.
   - Alternative considered: backend accepting 0-100. That would blur the API contract and affect non-UI clients.

4. **Use local mutation state for save feedback.**
   - The business assumptions card will show an aria-live success message after a successful save and clear it on the next edit.
   - Existing mutation invalidation continues refreshing business signals and opportunity queries.

## Risks / Trade-offs

- **Empty stats response could be misread by clients** -> Product detail will key off `dataPoints: 0`, and internal alert/agent service calls keep the existing exception behavior.
- **Percentage normalization may surprise users who intentionally enter `12` as a fraction** -> The UI will explicitly label that `12` means 12%, while fractional values like `0.12` are also accepted.
- **Success feedback may become stale after edits** -> Any field edit clears the success message before the next save.

## Migration Plan

Deploy as a normal frontend/backend release. No database migration is required. Rollback is safe because persisted business assumptions remain unchanged.

## Open Questions

None for this scoped fix.
