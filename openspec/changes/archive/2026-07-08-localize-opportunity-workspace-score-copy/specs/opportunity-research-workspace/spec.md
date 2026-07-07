## ADDED Requirements

### Requirement: Display localized opportunity score copy in workspace
The opportunity research workspace UI SHALL present known opportunity score factors, explanations, gate reasons, and next actions in merchant-facing Chinese when the surrounding interface is Chinese.

#### Scenario: Show localized workspace score factors
- **WHEN** the selected opportunity detail renders a score factor breakdown with known factors
- **THEN** the factor names MUST be displayed with Chinese merchant-facing labels
- **AND** the workspace MUST NOT directly expose known English factor labels such as `Price position`, `Price trend`, `Acquisition health`, `Review proxy`, or `Monitoring status`

#### Scenario: Show localized workspace score explanations
- **WHEN** the selected opportunity detail renders known score explanations or key reasons
- **THEN** the explanations MUST describe the evidence and caveats in Chinese
- **AND** the workspace MUST NOT directly expose known English explanation sentences for review proxy, price position, missing price history, acquisition history, monitoring status, availability, or market trend gaps

#### Scenario: Show localized recommendation gate copy
- **WHEN** the selected opportunity detail renders known recommendation gate reasons or next actions
- **THEN** the gate reasons and next actions MUST be shown in Chinese
- **AND** the workspace MUST preserve the meaning that missing or low-confidence evidence blocks stronger recommendations

#### Scenario: Preserve unknown workspace diagnostics
- **WHEN** the opportunity workspace receives an unknown factor name, explanation, gate reason, next action, or raw value that has no local display mapping
- **THEN** the UI MUST keep the original text visible instead of hiding it
- **AND** score, confidence, recommendation, gate status, factor contribution, weight, normalized score, missing-signal semantics, and persistence MUST remain unchanged
