## ADDED Requirements

### Requirement: Bulk acquisition considers all monitored products
The bulk acquisition service SHALL consider every monitoring product that matches acquisition eligibility, not only the first internal product batch.

#### Scenario: Monitoring products exceed one internal batch
- **WHEN** more monitoring products exist than fit in one internal processing batch
- **THEN** bulk acquisition SHALL continue through later batches and SHALL report totals across all considered monitoring products

### Requirement: Missing product acquisition returns not found
Manual product acquisition SHALL return a product-not-found error when the requested product does not exist.

#### Scenario: Manual acquisition requested for missing product
- **WHEN** a client requests manual acquisition for a product ID that does not exist
- **THEN** the API SHALL return a 404 product-not-found response instead of a generic scrape failure
