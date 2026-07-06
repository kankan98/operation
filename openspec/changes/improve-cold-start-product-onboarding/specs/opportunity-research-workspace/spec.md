## ADDED Requirements

### Requirement: Guide cold-start opportunity onboarding
The opportunity research workspace SHALL distinguish missing products from missing opportunity evidence and guide users to the correct next action.

#### Scenario: Guide user when no products exist
- **WHEN** the opportunity workspace has no product opportunities because there are no products
- **THEN** the workspace SHALL explain that opportunity analysis starts by adding products and SHALL provide a link or button to the products page

#### Scenario: Explain insufficient data when products exist
- **WHEN** products exist but opportunities are blocked or low-confidence because signals are missing
- **THEN** the workspace SHALL guide the user to record manual readings, run an immediate check, refresh market signals, or add business assumptions without presenting those gaps as verified demand or profit facts

#### Scenario: Preserve opportunity score separation
- **WHEN** the workspace displays cold-start or missing-data guidance
- **THEN** the guidance SHALL NOT change opportunity score, confidence, recommendation, recommendation gates, market signals, business metrics, factor contributions, or persisted research state
