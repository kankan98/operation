## Context

The backend business-signal API correctly returns stable machine keys such as `costBasis`, `inboundShipping`, and `referralFeeRate`. Product detail currently renders several of those keys directly, alongside English labels for the editable form and metric tiles. The application shell is Chinese by default, so the product-detail card should translate keys at the presentation boundary while leaving API contracts unchanged.

## Goals / Non-Goals

**Goals:**

- Show Chinese labels for business metric tiles, business input labels, and notes.
- Convert known missing-signal keys to merchant-facing Chinese labels in product detail.
- Cover both plain business keys (`costBasis`) and opportunity-prefixed keys (`business_costBasis`).
- Preserve all mutation payload keys and numeric normalization, including referral fee handling.

**Non-Goals:**

- Change backend schemas, database fields, or API response keys.
- Rewrite opportunity scoring explanations or machine-generated English reason strings.
- Introduce a full i18n namespace migration for this single card.

## Decisions

1. **Map display labels at the ProductDetail boundary.**
   - ProductDetail already owns the card composition and missing-signal badge rendering.
   - A local label map keeps this focused and avoids changing shared API types.

2. **Use the same mapping for business-card and score-card missing signals.**
   - This prevents product detail from showing `costBasis` in one card and `business_costBasis` in another.
   - Unknown keys still render as the original key so new backend signals remain visible during development.

3. **Keep form field semantics unchanged.**
   - Existing `updateField('costBasis', value)` and submit payload names remain the same.
   - Tests assert user-facing labels while still verifying the payload uses the original API keys.

## Risks / Trade-offs

- **Partial localization only** -> This change targets the highest-impact merchant input path. Broader backend reason localization can be a later change because it may require service-level message catalogs.
- **Unknown future keys remain raw** -> This is intentional for observability; known ecommerce operations fields get human labels.
- **Tests tied to copy** -> These labels are part of the UX contract for Chinese users, so copy-level tests are appropriate here.

## Verification

- Add failing ProductDetail tests for Chinese business input labels, metric labels, and missing-signal badges.
- Verify the tests fail against the current raw-key/English UI.
- Implement the label mapping and rerun ProductDetail tests, frontend lint/build, backend build, and strict OpenSpec validation.
- Deploy and verify with Playwright that product detail no longer exposes the audited raw labels in the business card.
