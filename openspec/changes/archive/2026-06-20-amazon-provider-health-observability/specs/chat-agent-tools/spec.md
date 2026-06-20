## ADDED Requirements

### Requirement: Include provider health in acquisition explanations
The Chat agent acquisition status tool SHALL include Amazon provider health context when explaining Amazon product acquisition status.

#### Scenario: Return provider health for Amazon products
- **WHEN** the agent requests acquisition status for an Amazon product
- **THEN** the tool SHALL include provider health status, provider summaries, chain summary, latest attempts, and recommendations when available

#### Scenario: Distinguish provider health from opportunity signals
- **WHEN** provider health is returned in a Chat acquisition explanation
- **THEN** the tool SHALL include a caveat that provider health explains data-source reliability and is not evidence of sales volume, demand, or profit margin

#### Scenario: Explain degraded fallback result
- **WHEN** a manual acquisition succeeds through browser fallback or cache fallback
- **THEN** the Chat explanation SHALL identify the result as a degraded fallback path rather than a healthy primary API provider result
