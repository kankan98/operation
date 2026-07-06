## ADDED Requirements

### Requirement: Localize known sell-price opportunity signals
Opportunity and business-signal guidance SHALL render known sell-price signal keys with merchant-facing Chinese labels instead of raw internal identifiers.

#### Scenario: Opportunity guidance includes sell-price signals
- **WHEN** opportunity guidance, gate factors, or missing-signal summaries include `sellPrice` or `business_sellPrice`
- **THEN** the UI SHALL display `目标售价` and SHALL NOT display the raw `sellPrice` or `business_sellPrice` identifiers
