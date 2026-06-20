## Context

The platform now has reliable product acquisition primitives, Amazon provider diagnostics, price monitoring, and an opportunity scoring MVP. The current scoring layer can rank products from available price, acquisition, rating, and review proxy signals, but it intentionally marks profit, fee, shipping, and demand signals as missing because the system has no merchant-specific cost basis. Merchants need those assumptions to decide whether a product deserves sourcing work, not just whether it looks interesting from monitoring data.

This change adds a product-level business signal model and derived financial metrics. The design keeps business assumptions separate from provider-acquired facts, because product cost, shipping, ads, and tax buffers usually come from the merchant's sourcing context rather than Amazon or another marketplace provider.

## Goals / Non-Goals

**Goals:**

- Persist product-level business assumptions supplied by the merchant.
- Compute deterministic per-unit gross margin, net margin, ROI, breakeven sell price, contribution profit, and completeness.
- Integrate computed metrics into opportunity scoring and explanations without overstating unverified demand or sales volume.
- Surface assumptions and metrics in product detail, opportunity workbench, shared schemas, OpenAPI, and Chat opportunity tools.
- Keep calculations testable, currency-aware enough for current products, and safe when fields are missing.

**Non-Goals:**

- Add Keepa, eBay, SP-API, ad platform, or live fee-estimation integrations in this change.
- Automatically infer sourcing cost, FBA fees, tax, customs, or advertising cost from external providers.
- Build a full inventory, purchase-order, or accounting module.
- Treat ROI or margin as demand evidence; these are merchant-assumption calculations only.

## Decisions

1. Store assumptions in a dedicated product business signals model.

   Use a product-linked table such as `product_business_signals` instead of adding many nullable columns to `products`. This keeps merchant assumptions versionable and avoids turning the core product record into a mixed source of provider facts and planning inputs. The table should include `product_id`, `currency`, `cost_basis`, `inbound_shipping`, `outbound_shipping`, `fulfillment_fee`, `platform_fee`, `referral_fee_rate`, `advertising_cost`, `tax_customs_buffer`, `target_sell_price`, optional `target_units`, `notes`, and timestamps.

   Alternative considered: append JSON to the product record. That would move faster, but it weakens schema validation, makes OpenAPI less useful, and complicates deterministic scoring tests.

2. Centralize financial calculation in a pure service.

   Add a calculation helper/service that accepts normalized assumptions plus current product price and returns derived metrics. It should not read the database directly. This keeps formulas deterministic and easy to test across missing-field, zero-cost, percentage-fee, currency, and rounding cases.

   Alternative considered: calculate inline inside opportunity scoring. That would reduce files, but it would make product detail, Chat, and API responses duplicate or subtly diverge from the scoring formula.

3. Use target sell price when provided, otherwise current monitored price.

   The merchant may want to test a planned sell price different from the current marketplace price. If `targetSellPrice` exists, financial metrics use it as the revenue side of the formula; otherwise they use the product's current price. Responses must expose which price source was used.

   Alternative considered: always use current price. That is simpler, but it blocks realistic sourcing analysis where the merchant is evaluating a planned listing price.

4. Keep fee fields explicit and transparent.

   Store fixed fees and percentage referral fees separately. Derived metrics should return the fee components used and mark fee fields as missing when absent. The system should not silently substitute platform defaults until a later change introduces verified fee schedules.

   Alternative considered: hardcode Amazon referral/FBA estimates. That would appear helpful but would create false precision and marketplace-specific assumptions.

5. Integrate business signals as scoring factors with confidence gating.

   Opportunity scoring should add margin/ROI factors only when the derived metrics are complete enough. If assumptions are missing, scoring must keep a missing signal and reduce confidence instead of treating missing cost as zero.

   Alternative considered: score missing cost as favorable. That would bias rankings toward products with less data, which is exactly the failure mode the MVP avoided.

## Risks / Trade-offs

- [Risk] Merchants may enter assumptions in the wrong currency or unit basis. -> Mitigation: require currency, show the price source used, and keep formulas per-unit until multi-currency conversion is explicitly added.
- [Risk] Missing assumptions could make scores feel unchanged. -> Mitigation: display missing business signals prominently and expose `check_data` or `investigate` guidance based on completeness.
- [Risk] Calculated ROI may be mistaken for verified profitability. -> Mitigation: label all margin/ROI values as assumption-based in API, UI, and Chat explanations.
- [Risk] Adding a table and endpoints increases migration surface in a dirty worktree. -> Mitigation: use a narrow migration with rollback, route tests, and existing validation conventions.

## Migration Plan

1. Add a migration for `product_business_signals` with a unique product relationship and indexes for product lookup.
2. Add a rollback migration that drops the table without touching product, price, or acquisition history.
3. Add shared schemas and backend route validation before exposing frontend editing.
4. Integrate calculations into opportunity scoring behind missing-signal checks.
5. Update product detail, opportunity workbench, and Chat tools after backend contracts are stable.
6. Validate with backend lint/build/tests, frontend build/relevant tests, OpenAPI tests, and `openspec validate --changes opportunity-business-signals`.

## Open Questions

- Should later changes support multiple assumption scenarios per product, such as conservative/base/aggressive?
- Should later changes add marketplace fee templates after official fee sources or merchant-maintained presets are available?
- Should target units remain informational in this change, or should it drive total profit projections in a follow-up?
