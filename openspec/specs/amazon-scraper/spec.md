## Purpose

Amazon scraper extracts product data from Amazon pages through the controlled browser fallback path and classifies page states for acquisition diagnostics.

## Requirements

### Requirement: Extract product price
The system SHALL extract the product price from Amazon product pages.

#### Scenario: Extract price from standard product page
- **WHEN** scraping an Amazon product URL with price displayed
- **THEN** system SHALL return the price as a number and currency as USD

#### Scenario: Handle missing price
- **WHEN** scraping a product page without price information
- **THEN** system SHALL return error with message "Price not found"

### Requirement: Extract product availability
The system SHALL extract the product availability status from Amazon product pages.

#### Scenario: Extract availability text
- **WHEN** scraping an Amazon product page
- **THEN** system SHALL return availability status text (e.g., "In Stock", "Out of Stock")

#### Scenario: Default to unknown when availability not found
- **WHEN** scraping a product page without availability information
- **THEN** system SHALL return availability as "unknown"

### Requirement: Extract optional product information
The system SHALL extract optional product information including title, rating, review count, and image URL.

#### Scenario: Extract all optional fields
- **WHEN** scraping an Amazon product page with complete information
- **THEN** system SHALL return title, rating, review count, and image URL when available

#### Scenario: Handle missing optional fields
- **WHEN** scraping a product page with some fields missing
- **THEN** system SHALL return undefined for missing optional fields

### Requirement: Initialize and close browser
The system SHALL manage browser lifecycle properly.

#### Scenario: Initialize browser before scraping
- **WHEN** initialize method is called
- **THEN** system SHALL launch Chromium browser in headless mode with proper user agent

#### Scenario: Close browser after scraping
- **WHEN** close method is called
- **THEN** system SHALL close browser and release resources

### Requirement: Handle scraping errors
The system SHALL handle errors gracefully during scraping.

#### Scenario: Return error result on scraping failure
- **WHEN** scraping fails due to network error, timeout, or invalid page
- **THEN** system SHALL return success=false with error message and timestamp

#### Scenario: Log scraping errors
- **WHEN** scraping fails
- **THEN** system SHALL log error details including URL, error message, and duration

#### Scenario: Testable error handling
- **WHEN** tests simulate scraping failures
- **THEN** system SHALL allow injection of mock error responses without making real HTTP requests

### Requirement: Support test mode
The system SHALL support a test mode that allows mocking of HTTP requests and browser automation.

#### Scenario: Mock HTTP responses in tests
- **WHEN** scraper runs in test mode
- **THEN** system SHALL intercept HTTP requests and return predefined mock HTML responses

#### Scenario: Mock browser automation in tests
- **WHEN** scraper uses Playwright in test mode
- **THEN** system SHALL use mock browser context that returns predefined page content

#### Scenario: Configurable mock data per test
- **WHEN** a test needs specific product page scenarios
- **THEN** system SHALL allow configuration of mock responses for price, availability, title, rating, and images

### Requirement: Provide mock response builder
The system SHALL provide utilities for building realistic mock Amazon page responses.

#### Scenario: Valid product page mock
- **WHEN** test needs a standard Amazon product page
- **THEN** system SHALL provide mock HTML with all required selectors (price, title, availability, etc.)

#### Scenario: Missing price scenario mock
- **WHEN** test needs to verify price-not-found handling
- **THEN** system SHALL provide mock HTML without price elements

#### Scenario: Out of stock scenario mock
- **WHEN** test needs to verify out-of-stock handling
- **THEN** system SHALL provide mock HTML with "Currently unavailable" or "Out of Stock" availability text

#### Scenario: Invalid page mock
- **WHEN** test needs to verify invalid page handling
- **THEN** system SHALL provide mock HTML that doesn't match Amazon product page structure

### Requirement: Isolate external dependencies in tests
The system SHALL ensure tests don't make real network calls or launch real browsers.

#### Scenario: No real HTTP calls in tests
- **WHEN** scraper tests run
- **THEN** system SHALL NOT make any actual HTTP requests to amazon.com

#### Scenario: No real browser launches in tests
- **WHEN** scraper tests run
- **THEN** system SHALL NOT launch actual Chromium browser instances

#### Scenario: Fast test execution
- **WHEN** scraper tests run with mocks
- **THEN** all scraper tests SHALL complete in under 2 seconds total

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
