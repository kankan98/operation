## ADDED Requirements

### Requirement: Support manual eBay product acquisition
The scraper API SHALL support manual acquisition for monitored eBay products through the existing product scrape endpoint.

#### Scenario: Scrape eBay product successfully
- **WHEN** POST `/api/scraper/product/:productId` is called for a valid eBay product and Browse API acquisition succeeds
- **THEN** the response SHALL include success=true, snapshotId, provider `ebay-browse`, source `official_api`, confidence, attemptId, and normalized product data

#### Scenario: Return eBay acquisition failure
- **WHEN** eBay acquisition fails for a valid product
- **THEN** the response SHALL include success=false, provider `ebay-browse`, source `official_api`, failureReason, attemptId when available, and a safe diagnostic summary

### Requirement: Expose eBay provider health API
The scraper API SHALL expose provider health for platform `ebay` using the existing provider health response contract.

#### Scenario: Query eBay health endpoint
- **WHEN** a client requests eBay provider health
- **THEN** the API SHALL return status, provider summaries, chain summary, latest attempts, and recommendations for platform `ebay`

#### Scenario: Filter eBay health by product
- **WHEN** a product ID is provided to the eBay health query
- **THEN** the API SHALL scope latest attempts and chain outcomes to that product

#### Scenario: Validate eBay health query
- **WHEN** eBay health query parameters are invalid
- **THEN** the API SHALL return validation errors using existing error response conventions
