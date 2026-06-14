# Product Detail UI Specification

## Purpose

This capability provides a detailed view of individual products including price history, statistics, and current status information.

---

## ADDED Requirements

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
