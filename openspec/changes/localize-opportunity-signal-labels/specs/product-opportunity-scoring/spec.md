## ADDED Requirements

### Requirement: Show readable opportunity signal labels
Opportunity scoring UIs SHALL present known missing scoring signals with user-facing labels instead of raw internal keys.

#### Scenario: Render opportunity missing signal badges
- **WHEN** the opportunity workspace displays known missing scoring signals for a candidate
- **THEN** the UI SHALL show readable Chinese labels for signals such as price history, acquisition history, review proxy, profit margin, market trend, sales volume, and demand
- **AND** the UI SHALL NOT expose known raw keys such as `price_history`, `business_costBasis`, `profit_margin`, `market_trend`, `sales_volume`, or `demand` in user-facing signal badges

#### Scenario: Render diagnostic missing signal text
- **WHEN** opportunity key reasons, factor explanations, gate reasons, or snapshot text contain a structured `Missing signals:` fragment with known internal signal keys
- **THEN** the UI SHALL replace those known signal keys with readable Chinese labels
- **AND** backend scoring payloads and API field names SHALL remain unchanged
