## ADDED Requirements

### Requirement: Localize known sell-price signal keys
The product detail UI SHALL render known sell-price signal keys with merchant-facing Chinese labels instead of raw internal identifiers.

#### Scenario: Product detail diagnostic text includes sell-price signals
- **WHEN** product-detail opportunity guidance includes `sellPrice` or `business_sellPrice` in diagnostic text or missing-signal lists
- **THEN** the UI SHALL display `目标售价` and SHALL NOT display the raw `sellPrice` or `business_sellPrice` identifiers
