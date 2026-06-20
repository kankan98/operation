## ADDED Requirements

### Requirement: Explain eBay acquisition status in Chat
The Chat agent tools SHALL explain eBay acquisition status using persisted eBay Browse attempts and provider health.

#### Scenario: Explain successful eBay acquisition
- **WHEN** the agent requests acquisition status for an eBay product with a recent successful Browse API attempt
- **THEN** the tool SHALL return provider `ebay-browse`, source `official_api`, confidence, timestamp, and concise source reliability context

#### Scenario: Explain failed eBay acquisition
- **WHEN** the latest eBay attempt failed
- **THEN** the tool SHALL return failure reason, root cause, safe diagnostics, and remediation guidance such as checking eBay credentials, item ID, marketplace, or rate limits

#### Scenario: Include eBay provider health
- **WHEN** the agent explains acquisition status for an eBay product
- **THEN** the tool SHALL include eBay provider health status and recommendations when available

### Requirement: Avoid unsupported eBay opportunity claims
The Chat agent SHALL avoid claiming eBay sales, demand, or verified profitability when eBay Browse data does not provide those facts.

#### Scenario: Explain eBay opportunity
- **WHEN** Chat explains an eBay product opportunity
- **THEN** it SHALL distinguish current listing data and provider health from demand, sales volume, margin, ROI, and merchant assumption metrics

#### Scenario: Missing eBay signals
- **WHEN** eBay opportunity scoring lacks business assumptions, demand signals, or stable acquisition history
- **THEN** Chat SHALL identify those missing signals and suggest collecting the relevant data before relying on the ranking
