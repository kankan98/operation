## ADDED Requirements

### Requirement: Explain business signals in opportunity tools
The Chat opportunity tools SHALL include assumption-based business metrics when explaining product opportunity scores.

#### Scenario: Explain complete business metrics
- **WHEN** the user asks why a product is a good or weak opportunity and the product has complete business metrics
- **THEN** the Chat tool response SHALL include net margin, ROI, breakeven sell price, contribution profit, price source, and a concise explanation of how those metrics influenced the score

#### Scenario: Explain missing business assumptions
- **WHEN** the product opportunity score lacks complete business assumptions
- **THEN** the Chat tool response SHALL identify the missing business signals and suggest adding the relevant assumptions before relying on profit or ROI analysis

#### Scenario: Avoid verified-profit claims
- **WHEN** Chat explains margin or ROI metrics
- **THEN** the explanation SHALL state that the values are calculated from merchant assumptions and are not verified sales, demand, or marketplace fee facts

### Requirement: Rank opportunities with business signal context
The Chat opportunity ranking tool SHALL expose business signal context for ranked opportunities.

#### Scenario: Return business summary in rankings
- **WHEN** the agent returns ranked product opportunities
- **THEN** each ranked item SHALL include business metric summaries when available and missing business signals when unavailable

#### Scenario: Support business readiness filtering
- **WHEN** the agent calls the opportunity ranking tool with a business readiness or minimum ROI filter
- **THEN** the tool SHALL return only products matching the filter and SHALL explain when no products match
