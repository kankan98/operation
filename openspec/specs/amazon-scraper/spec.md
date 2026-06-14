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
