## ADDED Requirements

### Requirement: Explain market signal status in Chat
The Chat agent tools SHALL explain product market signal status using persisted market signal snapshots and provider health.

#### Scenario: Explain fresh market signals
- **WHEN** the agent explains an Amazon product with fresh Keepa market signals
- **THEN** the tool SHALL return provider `keepa`, source `third_party`, confidence, freshness, price trend, rank trend, review velocity, rating movement, and concise source reliability context

#### Scenario: Explain missing market signals
- **WHEN** the product has no market signal snapshots
- **THEN** the tool SHALL identify market trend signals as missing and suggest refreshing market signals or configuring Keepa

#### Scenario: Explain failed market signal refresh
- **WHEN** the latest market signal refresh failed
- **THEN** the tool SHALL return failure reason, root cause, safe diagnostics, and remediation guidance such as checking credentials, quota, ASIN mapping, or retry timing

### Requirement: Avoid unsupported market signal claims in Chat
The Chat agent SHALL avoid presenting market proxy signals as verified demand, sales, or profitability.

#### Scenario: Explain rank trend caveat
- **WHEN** Chat references Keepa sales rank trend
- **THEN** it SHALL identify the signal as rank trend evidence and SHALL NOT state a verified sales volume

#### Scenario: Explain review velocity caveat
- **WHEN** Chat references review velocity
- **THEN** it SHALL identify the signal as review activity evidence and SHALL NOT claim verified demand or conversion rate

#### Scenario: Explain combined opportunity
- **WHEN** Chat explains a product opportunity using acquisition health, market signals, and merchant business assumptions
- **THEN** it SHALL distinguish current listing reliability, external trend evidence, and merchant-entered profitability assumptions
