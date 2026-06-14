## ADDED Requirements

### Requirement: Scrape single product
The system SHALL allow manual triggering of scraping for a single product.

#### Scenario: Scrape product successfully
- **WHEN** POST request to /api/scraper/product/:productId with valid product ID
- **THEN** system SHALL scrape the product, create snapshot, and return 200 status with success=true and snapshotId

#### Scenario: Return error for non-existent product
- **WHEN** POST request to /api/scraper/product/:productId with non-existent product ID
- **THEN** system SHALL return 500 status with SCRAPE_FAILED error code

#### Scenario: Update product information after scraping
- **WHEN** scraping succeeds
- **THEN** system SHALL update product's currentPrice, lastCheckedAt, and optionally title and imageUrl

### Requirement: Scrape all monitoring products
The system SHALL allow manual triggering of scraping for all products marked as monitoring.

#### Scenario: Scrape all monitoring products
- **WHEN** POST request to /api/scraper/all
- **THEN** system SHALL scrape all products where isMonitoring=true and return 200 status with summary

#### Scenario: Return detailed results
- **WHEN** scraping all products completes
- **THEN** system SHALL return total count, success count, failed count, and array of individual results

#### Scenario: Add delay between product scrapes
- **WHEN** scraping multiple products
- **THEN** system SHALL add 2-second delay between each product to avoid rate limiting

### Requirement: Create price snapshot on successful scrape
The system SHALL create a price snapshot record when scraping succeeds.

#### Scenario: Create snapshot with scraped data
- **WHEN** product is scraped successfully
- **THEN** system SHALL call PriceSnapshotService to create snapshot with productId, price, currency, availability, rating, and reviewCount

#### Scenario: Return snapshot ID in result
- **WHEN** snapshot is created
- **THEN** system SHALL include snapshotId in the scrape result
