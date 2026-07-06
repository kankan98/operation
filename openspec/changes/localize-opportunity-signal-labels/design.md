## Context

Opportunity APIs return stable machine keys for scoring and diagnostics, including business assumption fields (`costBasis`, `business_referralFeeRate`), market fields (`market_trend`), and high-level scoring signals (`profit_margin`, `sales_volume`, `demand`). Production Playwright verification showed that the Opportunities page renders those keys directly in the Chinese workspace. ProductDetail already maps similar keys at the presentation boundary, but Opportunities has separate row, detail, gate, snapshot, and comparison render paths.

## Goals / Non-Goals

**Goals:**

- Show Chinese labels for known business completeness and market status values in opportunity rows and details.
- Convert known business, market, and scoring missing-signal keys to merchant-facing Chinese labels wherever they are visible in the Opportunities UI.
- Convert known `Missing signals: ...` diagnostic fragments in key reasons, gate reasons, factor explanations, and snapshot displays.
- Preserve all API keys, filters, exports, scoring calculations, recommendation gates, persistence, and research workflow semantics.

**Non-Goals:**

- Change backend scoring output, database fields, API schemas, or export payload keys.
- Fully translate arbitrary English model/provider explanations.
- Hide unknown signal keys; unknown keys remain visible for diagnostics.
- Introduce a full i18n namespace migration for this focused display fix.

## Decisions

1. **Map labels at the Opportunities presentation boundary.**
   - The issue is visible text, not backend contracts.
   - Keeping the mapping local limits blast radius while matching the established ProductDetail fix.
   - Alternative considered: change backend responses. Rejected because stable machine keys are useful for filters, tests, exports, and scoring determinism.

2. **Use one helper set for row, detail, snapshot, gate, and comparison surfaces.**
   - Production showed raw keys in multiple parts of the same page.
   - A shared local helper prevents fixing one surface while leaving another inconsistent.
   - Unknown keys continue to render raw so new diagnostics remain observable.

3. **Localize missing-signal diagnostic fragments, not arbitrary prose.**
   - Strings like `Missing signals: price_history, business_costBasis.` are structured enough to rewrite safely.
   - Broader natural-language localization is larger and belongs in a dedicated message catalog or backend explanation change.

## Risks / Trade-offs

- **Partial localization** -> The change targets structured keys and known status labels only; remaining free-form English explanations can be handled later without mixing concerns.
- **Duplicate maps across ProductDetail and Opportunities** -> Acceptable for now because the pages use different domains and keeping this local avoids introducing a shared abstraction before the mapping surface stabilizes.
- **Tests tied to copy** -> These labels are part of the Chinese operator-facing UX contract, so copy-level tests are appropriate.
