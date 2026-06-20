## ADDED Requirements

### Requirement: Display eBay acquisition provenance in product detail
The product module SHALL display eBay Browse acquisition status and provenance through existing product detail acquisition surfaces.

#### Scenario: Show successful eBay acquisition
- **WHEN** an eBay product has a successful Browse API attempt
- **THEN** the product detail page SHALL show provider `ebay-browse`, source `official_api`, confidence, last checked time, and safe metadata

#### Scenario: Show eBay acquisition failure
- **WHEN** an eBay product has a failed Browse API attempt
- **THEN** the product detail page SHALL show the failure reason, safe root cause, and remediation guidance without exposing credentials or raw provider payloads

#### Scenario: Show eBay insufficient history
- **WHEN** an eBay product has no acquisition attempts
- **THEN** the product detail page SHALL show an empty acquisition state and manual check action

### Requirement: Include eBay health in opportunity workflows
The opportunity workbench SHALL include eBay acquisition health and missing-signal context when eBay products are ranked.

#### Scenario: Display eBay opportunity source
- **WHEN** opportunity results include eBay products
- **THEN** each result SHALL show platform `ebay`, current price, confidence, acquisition health, and missing signals when available

#### Scenario: Preserve manual check action for eBay
- **WHEN** an eBay opportunity recommends `check_data`
- **THEN** the workbench SHALL expose the existing manual acquisition action and SHALL show eBay provider failure context after refresh
