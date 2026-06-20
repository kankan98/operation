## ADDED Requirements

### Requirement: Display market signals in product detail
The product module SHALL display latest market signal freshness, provider provenance, and trend summaries on product detail surfaces.

#### Scenario: Show fresh market signals
- **WHEN** a product has a latest market signal snapshot
- **THEN** the product detail page SHALL show provider, source, confidence, freshness, price trend summary, rank trend summary, review velocity, rating movement, and safe caveats

#### Scenario: Show missing market signals
- **WHEN** a product has no market signal snapshot
- **THEN** the product detail page SHALL show a missing market signals state and an action to refresh market signals when supported

#### Scenario: Show degraded market signal refresh
- **WHEN** the latest market signal refresh failed
- **THEN** the product detail page SHALL show failure reason, safe root cause, and remediation guidance without exposing credentials or raw provider payloads

### Requirement: Include market signals in opportunity workflows
The opportunity workbench SHALL make market trend evidence visible while scanning and comparing ranked products.

#### Scenario: Display opportunity market signal summary
- **WHEN** opportunity results include market signal factors
- **THEN** each opportunity result SHALL show market signal freshness and concise trend indicators alongside score, confidence, recommendation, platform, and price

#### Scenario: Explain opportunity market factors
- **WHEN** a user opens an opportunity explanation
- **THEN** the UI SHALL show market trend factors separately from merchant assumption factors and acquisition health

#### Scenario: Refresh market signals from opportunity workflow
- **WHEN** an opportunity result recommends checking missing market signals
- **THEN** the workbench SHALL expose a market signal refresh action for supported products
