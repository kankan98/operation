## Context

ProductDetail and Opportunities both maintain frontend-only signal label maps. The label helpers already normalize `business_*` keys by stripping the prefix and then looking up a merchant-facing label. Existing maps include `targetSellPrice`, but production diagnostics and business metric inputs can use the canonical metric input name `sellPrice`. As a result, `business_sellPrice` and `sellPrice` are treated as unknown and shown verbatim.

## Goals / Non-Goals

**Goals:**

- Map `sellPrice` and `business_sellPrice` to `目标售价` wherever known signal labels are used in ProductDetail.
- Keep Opportunity signal labeling consistent with ProductDetail for the same business vocabulary.
- Add focused tests proving diagnostic text and missing-signal lists do not expose those internal keys.

**Non-Goals:**

- Do not rename API fields, persisted assumptions, business metric inputs, or opportunity scoring signals.
- Do not change financial formulas, completeness evaluation, or backend signal generation.
- Do not introduce a broad i18n refactor.

## Decisions

- Reuse the existing label-map pattern by adding `sellPrice: '目标售价'`.
  - Rationale: the helpers already handle both raw keys and `business_` prefixed keys. Adding the canonical key fixes all mapped surfaces with the smallest change.
  - Alternative considered: replace `sellPrice` with `targetSellPrice` before rendering. That would add another normalization path and still require keeping both key names in sync.

- Apply the mapping in both ProductDetail and Opportunities.
  - Rationale: both pages expose opportunity/business signal guidance and use near-identical helper functions. Fixing only one page would leave the same user-visible leak elsewhere.
  - Alternative considered: limit the change to ProductDetail because it was the production page observed. That is narrower but knowingly leaves a same-root defect in a sibling workflow.

## Risks / Trade-offs

- Duplicate signal label maps can drift again -> targeted tests cover both pages for the `sellPrice` vocabulary.
- `目标售价` may be semantically close to `targetSellPrice` rather than current observed price -> in these diagnostic contexts `sellPrice` is the revenue input used for business assumptions, so the existing merchant-facing label is appropriate.
