## ADDED Requirements

### Requirement: Explain product acquisition status
The system SHALL provide a Chat agent tool path that explains the latest product acquisition status using scrape jobs and attempt history.

#### Scenario: Explain latest successful acquisition
- **WHEN** the agent requests acquisition status for a product with a recent successful attempt
- **THEN** the tool SHALL return provider, source, confidence, timestamp, and a concise explanation of the successful acquisition

#### Scenario: Explain latest failed acquisition
- **WHEN** the agent requests acquisition status for a product with a recent failed attempt
- **THEN** the tool SHALL return failure reason, provider, source, timestamp, safe diagnostics, and user-friendly remediation guidance

#### Scenario: No attempt history
- **WHEN** the product has no scrape attempts
- **THEN** the tool SHALL explain that no acquisition has run yet and suggest running a manual check

### Requirement: Avoid hidden acquisition during explanation
The Chat agent SHALL NOT trigger product acquisition while merely explaining acquisition status.

#### Scenario: User asks why data is missing
- **WHEN** the user asks why a product has no fresh data
- **THEN** the agent SHALL inspect existing attempts and jobs without starting a new acquisition job

#### Scenario: User explicitly asks to check now
- **WHEN** the user explicitly asks the assistant to check or refresh product data now
- **THEN** the agent MAY call the manual acquisition path and SHALL report the resulting job, attempt, provider, and failure reason or success

### Requirement: Use structured failure reason language
The Chat agent SHALL translate structured acquisition failure reasons into concise user-facing explanations.

#### Scenario: Captcha or blocked explanation
- **WHEN** the latest failure reason is `captcha` or `blocked`
- **THEN** the agent SHALL explain that browser fallback was stopped by platform protection and recommend configuring or checking the API provider

#### Scenario: Provider unavailable explanation
- **WHEN** the latest failure reason is `provider_unavailable`
- **THEN** the agent SHALL explain that the configured provider is unavailable or missing credentials and identify the provider when known

#### Scenario: Selector drift explanation
- **WHEN** the latest failure reason is `selector_drift`
- **THEN** the agent SHALL explain that the browser fallback page structure no longer matches known selectors
