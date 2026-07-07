## ADDED Requirements

### Requirement: Display localized opportunity score explanations
The product detail UI SHALL present known opportunity score breakdown factors and explanations in merchant-facing Chinese when the surrounding interface is Chinese.

#### Scenario: Show localized score factor labels
- **WHEN** the product detail page renders an opportunity score breakdown with known factors
- **THEN** the factor names MUST be displayed with Chinese merchant-facing labels
- **AND** the page MUST NOT directly expose known English factor labels such as `Review proxy`, `Price position`, `Acquisition health`, or `Monitoring status`

#### Scenario: Show localized score explanation text
- **WHEN** the product detail page renders known opportunity score factor explanations
- **THEN** the explanations MUST describe the evidence and caveats in Chinese
- **AND** the page MUST NOT directly expose known English explanation sentences for review proxy, price position, missing price history, acquisition history, monitoring status, or market trend gaps

#### Scenario: Preserve unknown diagnostics
- **WHEN** the product detail page receives an unknown factor name or explanation that has no local display mapping
- **THEN** the UI MUST keep the original text visible instead of hiding it
- **AND** the score, contribution, weight, raw value, direction, and missing-signal semantics MUST remain unchanged
