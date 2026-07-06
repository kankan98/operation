## ADDED Requirements

### Requirement: Show merchant-facing business labels
The product detail UI SHALL show merchant-facing business assumption labels in the active Chinese interface instead of raw internal API field names.

#### Scenario: Render business assumption form labels
- **WHEN** a user views the product detail business assumptions form in the Chinese UI
- **THEN** the form SHALL label cost, inbound shipping, outbound shipping, fulfillment fee, platform fee, referral fee rate, advertising cost, tax/customs buffer, target sell price, target units, currency, and notes with user-facing Chinese copy
- **AND** saving the form SHALL continue to submit the original API field names and normalized numeric values

#### Scenario: Render business metric labels
- **WHEN** product business metrics are shown on product detail
- **THEN** the UI SHALL label net margin, ROI, breakeven sell price, contribution profit per unit, and total variable cost with merchant-facing Chinese copy

#### Scenario: Render known missing signal labels
- **WHEN** product detail displays known missing business signals or opportunity missing signals
- **THEN** the UI SHALL show readable Chinese labels for those known signals rather than raw keys such as `costBasis` or `business_costBasis`
- **AND** unknown signal keys MAY remain visible as raw keys so new backend diagnostics are not hidden
