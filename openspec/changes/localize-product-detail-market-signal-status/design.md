## Context

The product detail market signal card is a frontend display surface for Keepa market trend evidence. It already explains that Keepa data is proxy evidence, but several visible labels still come directly from internal API status fields or English UI strings. The same fields are correct as API values and should not be renamed in data contracts.

## Goals / Non-Goals

**Goals:**

- Render market signal freshness/status badges with Chinese labels.
- Render Keepa provider health status with Chinese labels while preserving the provider name.
- Localize the market signal metric labels, history table headers, and default caveat text.
- Keep all market signal refresh, health, history, and scoring behavior unchanged.

**Non-Goals:**

- Do not rename API status values such as `fresh`, `missing`, `failed`, `stale`, `healthy`, or `insufficient_history`.
- Do not change Keepa provider behavior, market health calculations, stored snapshots, or opportunity score formulas.
- Do not translate backend-provided health recommendation messages in this change.

## Decisions

- Add small ProductDetail display label maps for market signal statuses and provider health statuses.
  - Rationale: the defect is strictly presentational and localized to the product detail card. A mapping keeps API values intact and follows existing patterns already used for signal labels.
  - Alternative considered: normalize statuses in backend responses. That would mix display language into API contracts and risk breaking other consumers.

- Localize static metric/table labels directly in the card.
  - Rationale: the surrounding product detail UI is already mostly hardcoded Chinese in this area. The safest improvement is to align these labels with the current UI language without a broader i18n refactor.

## Risks / Trade-offs

- Some backend recommendation strings can remain English -> this change only addresses static labels and known statuses; translating generated/provider messages should be handled in a later, broader diagnostic-copy pass.
- Duplicate status labels can drift from other pages -> targeted ProductDetail tests protect the market signal card behavior this change owns.
