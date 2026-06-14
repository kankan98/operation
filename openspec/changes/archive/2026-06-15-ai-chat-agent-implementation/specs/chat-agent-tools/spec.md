## ADDED Requirements

### Requirement: Define searchProducts tool
The system SHALL provide a searchProducts tool that queries the products database by keyword, platform, and price range.

#### Scenario: Search by keyword
- **WHEN** agent calls searchProducts with query parameter
- **THEN** system SHALL return products where title or brand matches query (case-insensitive)

#### Scenario: Filter by platform
- **WHEN** agent calls searchProducts with platform parameter
- **THEN** system SHALL return only products from specified platform

#### Scenario: Filter by price range
- **WHEN** agent calls searchProducts with maxPrice parameter
- **THEN** system SHALL return only products where currentPrice is less than or equal to maxPrice

#### Scenario: Limit results
- **WHEN** search returns more than 10 products
- **THEN** system SHALL return top 10 results sorted by most recently updated

#### Scenario: No results found
- **WHEN** search matches no products
- **THEN** system SHALL return empty array with message "No products found"

### Requirement: Define getProductDetails tool
The system SHALL provide a getProductDetails tool that retrieves full information for a specific product.

#### Scenario: Get product by ID
- **WHEN** agent calls getProductDetails with valid product ID
- **THEN** system SHALL return product with all fields including price, platform, monitoring status, and last check time

#### Scenario: Product not found
- **WHEN** agent calls getProductDetails with non-existent ID
- **THEN** system SHALL return error "Product not found"

#### Scenario: Include recent price history
- **WHEN** agent calls getProductDetails with includeHistory parameter true
- **THEN** system SHALL return last 30 price snapshots

### Requirement: Define analyzePriceTrend tool
The system SHALL provide an analyzePriceTrend tool that calculates price statistics for a product.

#### Scenario: Calculate price statistics
- **WHEN** agent calls analyzePriceTrend with product ID
- **THEN** system SHALL return current price, highest price, lowest price, average price, price change, and price change percentage

#### Scenario: Insufficient data
- **WHEN** product has fewer than 2 price snapshots
- **THEN** system SHALL return error "Insufficient price data for analysis"

#### Scenario: Include trend direction
- **WHEN** analyzing price trend
- **THEN** system SHALL include trend field with value "rising", "falling", or "stable"

### Requirement: Define createAlert tool
The system SHALL provide a createAlert tool that creates price alert rules based on natural language criteria.

#### Scenario: Create price threshold alert
- **WHEN** agent calls createAlert with threshold condition and value
- **THEN** system SHALL create alert rule with specified threshold in alert_rules table

#### Scenario: Create price change alert
- **WHEN** agent calls createAlert with percentage change condition
- **THEN** system SHALL create alert rule monitoring price change percentage

#### Scenario: Validate product exists
- **WHEN** agent calls createAlert for non-existent product
- **THEN** system SHALL return error "Product not found"

#### Scenario: Set alert severity
- **WHEN** agent calls createAlert
- **THEN** system SHALL set severity based on condition importance (critical for large drops, warning for moderate changes)

### Requirement: Define getAlertsList tool
The system SHALL provide a getAlertsList tool that retrieves recent alerts.

#### Scenario: Get unread alerts
- **WHEN** agent calls getAlertsList with unreadOnly parameter true
- **THEN** system SHALL return only alerts where isRead is false

#### Scenario: Filter by severity
- **WHEN** agent calls getAlertsList with severity parameter
- **THEN** system SHALL return only alerts matching specified severity

#### Scenario: Limit results
- **WHEN** agent calls getAlertsList without limit parameter
- **THEN** system SHALL return maximum 20 most recent alerts

#### Scenario: Include product details
- **WHEN** returning alerts
- **THEN** system SHALL include product title and platform for each alert

### Requirement: Define addProductMonitoring tool
The system SHALL provide an addProductMonitoring tool that adds new products to monitoring system.

#### Scenario: Add product with URL
- **WHEN** agent calls addProductMonitoring with product URL and platform
- **THEN** system SHALL create new product record with isMonitoring set to true

#### Scenario: Validate URL format
- **WHEN** agent provides invalid URL format
- **THEN** system SHALL return error "Invalid product URL format for specified platform"

#### Scenario: Check for duplicates
- **WHEN** product URL already exists in database
- **THEN** system SHALL return error "Product already being monitored"

#### Scenario: Set default check interval
- **WHEN** agent does not specify check interval
- **THEN** system SHALL set checkInterval to 24 hours by default

### Requirement: Define getCompetitorAnalysis tool
The system SHALL provide a getCompetitorAnalysis tool that compares products across platforms.

#### Scenario: Compare by ASIN
- **WHEN** agent calls getCompetitorAnalysis with ASIN
- **THEN** system SHALL find all products with matching ASIN across different platforms

#### Scenario: Calculate price differences
- **WHEN** comparing competitor products
- **THEN** system SHALL return price differences and identify cheapest option

#### Scenario: No competitors found
- **WHEN** no matching products exist on other platforms
- **THEN** system SHALL return message "No competitors found for this product"

### Requirement: Define getMarketInsights tool
The system SHALL provide a getMarketInsights tool that analyzes market trends from monitored products.

#### Scenario: Analyze platform distribution
- **WHEN** agent calls getMarketInsights
- **THEN** system SHALL return count of products per platform

#### Scenario: Calculate average prices by platform
- **WHEN** agent calls getMarketInsights
- **THEN** system SHALL return average current price for each platform

#### Scenario: Identify price drops
- **WHEN** agent calls getMarketInsights
- **THEN** system SHALL return count of products with recent price drops greater than 10 percent

### Requirement: Define queryDatabase tool
The system SHALL provide a queryDatabase tool for flexible data queries.

#### Scenario: Count products by status
- **WHEN** agent calls queryDatabase to count monitoring status
- **THEN** system SHALL return count of products grouped by isMonitoring field

#### Scenario: Get recent activity
- **WHEN** agent calls queryDatabase for recent updates
- **THEN** system SHALL return products updated in last 24 hours

#### Scenario: Safe query execution
- **WHEN** executing database queries
- **THEN** system SHALL use parameterized queries to prevent SQL injection

### Requirement: Define generateReport tool
The system SHALL provide a generateReport tool that creates summary reports.

#### Scenario: Generate daily summary
- **WHEN** agent calls generateReport with type "daily"
- **THEN** system SHALL return summary of price changes, new alerts, and monitoring status for last 24 hours

#### Scenario: Generate product report
- **WHEN** agent calls generateReport with type "product" and product ID
- **THEN** system SHALL return detailed report with price history chart data and statistics

#### Scenario: Format report as structured data
- **WHEN** generating any report
- **THEN** system SHALL return data in structured JSON format suitable for display or further analysis

### Requirement: Handle tool execution errors
The system SHALL handle tool execution failures gracefully and return meaningful errors to agent.

#### Scenario: Database query timeout
- **WHEN** tool query takes longer than 10 seconds
- **THEN** system SHALL cancel query and return error "Database query timeout"

#### Scenario: Missing required parameters
- **WHEN** agent calls tool without required parameters
- **THEN** system SHALL return error listing missing parameters

#### Scenario: Tool execution exception
- **WHEN** tool throws unexpected error during execution
- **THEN** system SHALL log error details and return generic error "Tool execution failed"

### Requirement: Log all tool executions
The system SHALL log every tool call with parameters and results for debugging and monitoring.

#### Scenario: Log successful execution
- **WHEN** tool executes successfully
- **THEN** system SHALL log tool name, parameters, execution time, and result summary

#### Scenario: Log failed execution
- **WHEN** tool execution fails
- **THEN** system SHALL log tool name, parameters, error message, and stack trace
