## ADDED Requirements

### Requirement: Classify Amazon page states
The system SHALL classify Amazon page states before treating missing selectors as missing product data.

#### Scenario: Detect robot check page
- **WHEN** an Amazon page contains robot-check text or captcha elements
- **THEN** the scraper SHALL return a structured failure with reason "captcha" or "blocked"

#### Scenario: Detect geo restriction
- **WHEN** an Amazon page indicates the product cannot be viewed or shipped in the current region
- **THEN** the scraper SHALL return a structured failure with reason "geo_restricted"

#### Scenario: Detect unavailable product page
- **WHEN** an Amazon page indicates the product does not exist or is unavailable
- **THEN** the scraper SHALL return a structured failure with reason "not_found"

#### Scenario: Detect selector drift
- **WHEN** an Amazon page appears to be a product page but expected product selectors cannot be resolved
- **THEN** the scraper SHALL return a structured failure with reason "selector_drift"

### Requirement: Capture Amazon scraper diagnostics
The system SHALL capture diagnostics for failed Amazon browser fallback attempts.

#### Scenario: Include page diagnostics on failure
- **WHEN** Amazon browser fallback fails
- **THEN** the failure result SHALL include diagnostic metadata such as page title, final URL, detected state, and available status information

#### Scenario: Redact sensitive diagnostics
- **WHEN** diagnostic metadata is persisted
- **THEN** the system SHALL avoid storing cookies, credentials, or full request headers

### Requirement: Use selector fallback for Amazon product fields
The system SHALL use multiple selector strategies for Amazon product fields before declaring extraction failure.

#### Scenario: Extract price from fallback selector
- **WHEN** the primary Amazon price selector is absent but a known fallback selector contains a valid price
- **THEN** the scraper SHALL extract the price successfully

#### Scenario: Report price missing after all selectors fail
- **WHEN** all known Amazon price selectors are absent and the page is otherwise a valid product page
- **THEN** the scraper SHALL return a structured failure with reason "price_missing"

