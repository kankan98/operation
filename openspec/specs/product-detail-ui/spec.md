# Product Detail UI Specification

## Purpose

This capability provides a detailed view of individual products including price history, statistics, and current status information.

---
## Requirements
### Requirement: Display product information
The system SHALL display comprehensive product details and metadata.

#### Scenario: Show product header with title and platform
- **WHEN** viewing product detail page
- **THEN** system SHALL display product title, platform badge, and back button to products list

#### Scenario: Display product metadata
- **WHEN** viewing product detail page
- **THEN** system SHALL show ASIN, brand (if available), monitoring status, check interval, creation date, and last checked timestamp

#### Scenario: Show external link button
- **WHEN** viewing product detail page
- **THEN** system SHALL display "View on [platform]" button that opens productUrl in new tab

### Requirement: Display price statistics
The system SHALL show price analysis statistics from the analysis API.

#### Scenario: Show current price card
- **WHEN** viewing product with price data
- **THEN** system SHALL display current price in a metric card

#### Scenario: Show lowest price card
- **WHEN** viewing product with price data
- **THEN** system SHALL display lowest price in green color in a metric card

#### Scenario: Show highest price card
- **WHEN** viewing product with price data
- **THEN** system SHALL display highest price in red color in a metric card

#### Scenario: Show price change percentage card
- **WHEN** viewing product with price data
- **THEN** system SHALL display price change percentage with green color for negative changes (price drop) and red color for positive changes (price increase)

#### Scenario: Handle product with no price data
- **WHEN** viewing product with no price snapshots
- **THEN** system SHALL display "N/A" in all price statistic cards

### Requirement: Display price trend chart
The system SHALL embed an interactive price history chart.

#### Scenario: Show chart when snapshots exist
- **WHEN** product has at least 2 price snapshots
- **THEN** system SHALL render PriceTrendChart component with snapshot data

#### Scenario: Hide chart when insufficient data
- **WHEN** product has fewer than 2 snapshots
- **THEN** system SHALL not display the chart section

### Requirement: Handle loading states
The system SHALL show loading indicators during data fetching.

#### Scenario: Show loading during initial data fetch
- **WHEN** page is loading product data, stats, and snapshots
- **THEN** system SHALL display "Loading..." message

#### Scenario: Show not found message for invalid product ID
- **WHEN** product ID does not exist in database
- **THEN** system SHALL display "Product not found" message

### Requirement: Trigger manual acquisition from product detail
The product detail page SHALL allow users to trigger manual product data acquisition through the scraper acquisition API.

#### Scenario: User clicks check now
- **WHEN** the user clicks the product detail "check now" action
- **THEN** the frontend SHALL call `POST /api/scraper/product/:productId`

#### Scenario: Successful manual acquisition refreshes product data
- **WHEN** manual acquisition succeeds
- **THEN** the page SHALL refresh product details, price statistics, price snapshots, and recent acquisition attempts

#### Scenario: Failed manual acquisition shows structured result
- **WHEN** manual acquisition returns success=false
- **THEN** the page SHALL show the failure reason and keep the product detail page usable

### Requirement: Display recent acquisition attempts
The product detail page SHALL display recent acquisition attempts for the current product.

#### Scenario: Show attempt list
- **WHEN** product detail loads for a valid product
- **THEN** the page SHALL request recent attempts from `GET /api/scraper/product/:productId/attempts`

#### Scenario: Show attempt summary fields
- **WHEN** attempts are available
- **THEN** the page SHALL display provider, source, status, failure reason, confidence, duration, and timestamp for each attempt

#### Scenario: Show safe diagnostics
- **WHEN** an attempt contains diagnostic metadata
- **THEN** the page SHALL display only safe diagnostic summary fields such as page title, final URL, detected state, HTTP status, or provider error code

#### Scenario: Empty attempt history
- **WHEN** a product has no acquisition attempts
- **THEN** the page SHALL show an empty state instead of hiding acquisition status entirely

### Requirement: Track manual acquisition job state
The product detail page SHALL expose job or attempt identifiers returned by manual acquisition.

#### Scenario: Result includes job ID
- **WHEN** manual acquisition returns a job ID
- **THEN** the page SHALL display or retain the job ID so the user can correlate the result with attempt history

#### Scenario: Result includes attempt ID
- **WHEN** manual acquisition returns an attempt ID
- **THEN** the page SHALL highlight or surface the matching attempt in recent acquisition history

### Requirement: Display Amazon provider health
The product detail page SHALL display Amazon provider health when viewing an Amazon product with available provider health data.

#### Scenario: Show provider health summary
- **WHEN** an Amazon product detail page loads
- **THEN** the page SHALL request Amazon provider health for that product and show provider status, attempt count, fallback count, cache count, primary failure count, and recommendations when available

#### Scenario: Label degraded fallback paths
- **WHEN** the latest acquisition result or provider health indicates browser fallback or cache fallback usage
- **THEN** the page SHALL label the data-source path as degraded instead of presenting it as healthy primary provider coverage

#### Scenario: Keep page usable without provider health
- **WHEN** provider health data is unavailable or insufficient
- **THEN** the product detail page SHALL continue to show product details and recent attempts without blocking the main view

### Requirement: Display product acquisition job health
The product detail page SHALL display queue and job health for the current product.

#### Scenario: Show active job state
- **WHEN** a product has an active acquisition job
- **THEN** the page SHALL show job status, attempt count, next run time, lease state, provider gate context, and latest attempt summary

#### Scenario: Show delayed job state
- **WHEN** a product job is delayed by retry backoff, provider rate limit, quota exhaustion, or worker unavailability
- **THEN** the page SHALL show the delay reason and remediation guidance without blocking product detail data

#### Scenario: Show no job state
- **WHEN** a product has no acquisition job history
- **THEN** the page SHALL show a neutral empty operational state

### Requirement: Expose safe product job controls
The product detail page SHALL expose bounded retry and cancel actions when job state allows them.

#### Scenario: Retry failed job from product detail
- **WHEN** a product job is failed or cancelled
- **THEN** the page SHALL show a retry action that calls the job control API and refreshes product job diagnostics

#### Scenario: Cancel pending job from product detail
- **WHEN** a product job is pending or retry-scheduled
- **THEN** the page SHALL show a cancel action that calls the job control API and refreshes product job diagnostics

#### Scenario: Hide unsafe controls
- **WHEN** a job state does not support retry or cancel
- **THEN** the page SHALL hide or disable the unsupported action with a concise state-specific reason

### Requirement: Label queue health as operational context
The product detail page SHALL distinguish queue operations from product quality or opportunity evidence.

#### Scenario: Queue caveat visible
- **WHEN** product job or queue health is shown
- **THEN** the page SHALL display a caveat that queue health explains acquisition operations and is not evidence of sales, demand, margin, ROI, or profitability

### Requirement: Display price source and freshness on decision-driving numbers
The product detail UI SHALL surface the source and freshness of price numbers so the user can judge how much to trust them when deciding. Numbers SHALL never appear as authoritative without an indication of where they came from and whether they may be outdated.

#### Scenario: Current price shows its source
- **WHEN** the product detail page renders the current price KPI and price statistics include provenance
- **THEN** the UI SHALL display the source label (e.g. 手动录入) alongside the current price

#### Scenario: Stale current price is visibly flagged
- **WHEN** the current price provenance is stale
- **THEN** the UI SHALL display a "可能已过时，建议复核" style indicator rather than presenting the value as freshly verified

#### Scenario: Price history rows reflect per-row source and age
- **WHEN** the price history table renders snapshot rows
- **THEN** each row SHALL display that row's source and its recorded date/time, so a reading's origin and age are visible per row (freshness/stale emphasis for the decision-driving current price is delivered via the backend-derived provenance on the current-price KPI, keeping freshness thresholds a single backend source of truth)

#### Scenario: Cache invalidation refreshes list surfaces after manual entry
- **WHEN** a manual reading is saved from the product detail page
- **THEN** the product list cache SHALL be invalidated so the product card price and stale marker update without a manual refresh

