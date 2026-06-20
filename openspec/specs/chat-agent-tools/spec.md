# Chat Agent Tools

## Purpose

Tool definitions for AI chat agent to interact with the e-commerce monitoring system. Provides 10 specialized tools for product search, price analysis, alert management, and reporting.

---
## Requirements
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

### Requirement: Explain product acquisition status
The system SHALL provide a Chat agent tool path that explains the latest product acquisition status using scrape jobs and attempt history.

#### Scenario: Explain latest successful acquisition
- **WHEN** the agent requests acquisition status for a product with a recent successful attempt
- **THEN** the tool SHALL return provider, source, confidence, timestamp, and a concise explanation of the successful acquisition

#### Scenario: Explain latest failed acquisition
- **WHEN** the agent requests acquisition status for a product with a recent failed attempt
- **THEN** the tool SHALL return failure reason, provider, source, timestamp, safe diagnostics, and user-friendly remediation guidance

#### Scenario: No attempt history
- **WHEN** the product has no scrape attempts
- **THEN** the tool SHALL explain that no acquisition has run yet and suggest running a manual check

### Requirement: Avoid hidden acquisition during explanation
The Chat agent SHALL NOT trigger product acquisition while merely explaining acquisition status.

#### Scenario: User asks why data is missing
- **WHEN** the user asks why a product has no fresh data
- **THEN** the agent SHALL inspect existing attempts and jobs without starting a new acquisition job

#### Scenario: User explicitly asks to check now
- **WHEN** the user explicitly asks the assistant to check or refresh product data now
- **THEN** the agent MAY call the manual acquisition path and SHALL report the resulting job, attempt, provider, and failure reason or success

### Requirement: Use structured failure reason language
The Chat agent SHALL translate structured acquisition failure reasons into concise user-facing explanations.

#### Scenario: Captcha or blocked explanation
- **WHEN** the latest failure reason is `captcha` or `blocked`
- **THEN** the agent SHALL explain that browser fallback was stopped by platform protection and recommend configuring or checking the API provider

#### Scenario: Provider unavailable explanation
- **WHEN** the latest failure reason is `provider_unavailable`
- **THEN** the agent SHALL explain that the configured provider is unavailable or missing credentials and identify the provider when known

#### Scenario: Selector drift explanation
- **WHEN** the latest failure reason is `selector_drift`
- **THEN** the agent SHALL explain that the browser fallback page structure no longer matches known selectors

### Requirement: Define opportunity ranking tool
The system SHALL provide a Chat agent tool that returns ranked product opportunities using the opportunity scoring service.

#### Scenario: Ask for best opportunities
- **WHEN** the user asks which products deserve attention or investigation
- **THEN** the agent MAY call the opportunity ranking tool and SHALL return ranked products with score, confidence, recommendation, and key reasons

#### Scenario: Apply opportunity filters
- **WHEN** the agent calls the opportunity ranking tool with platform, minimum score, recommendation, or limit parameters
- **THEN** the tool SHALL return only matching ranked opportunities

#### Scenario: No opportunities
- **WHEN** no products match the opportunity filters
- **THEN** the tool SHALL return an empty list with a concise explanation

### Requirement: Define opportunity explanation tool
The system SHALL provide a Chat agent tool that explains a single product opportunity score.

#### Scenario: Explain product score
- **WHEN** the user asks why a product is or is not a good opportunity
- **THEN** the agent MAY call the opportunity explanation tool and SHALL return score, confidence, factor breakdown, missing signals, and recommended action

#### Scenario: Missing signal explanation
- **WHEN** the score confidence is reduced because signals are missing
- **THEN** the tool SHALL identify missing signals and suggest data collection actions such as running a manual check

### Requirement: Avoid unsupported opportunity claims in Chat
The Chat agent SHALL avoid claiming profit, demand, or sales certainty when the scoring inputs do not contain those signals.

#### Scenario: Profit signal missing
- **WHEN** opportunity scoring lacks cost, fee, shipping, or sales data
- **THEN** the Chat explanation SHALL state that profit or demand cannot yet be verified from available data

### Requirement: Include provider health in acquisition explanations
The Chat agent acquisition status tool SHALL include Amazon provider health context when explaining Amazon product acquisition status.

#### Scenario: Return provider health for Amazon products
- **WHEN** the agent requests acquisition status for an Amazon product
- **THEN** the tool SHALL include provider health status, provider summaries, chain summary, latest attempts, and recommendations when available

#### Scenario: Distinguish provider health from opportunity signals
- **WHEN** provider health is returned in a Chat acquisition explanation
- **THEN** the tool SHALL include a caveat that provider health explains data-source reliability and is not evidence of sales volume, demand, or profit margin

#### Scenario: Explain degraded fallback result
- **WHEN** a manual acquisition succeeds through browser fallback or cache fallback
- **THEN** the Chat explanation SHALL identify the result as a degraded fallback path rather than a healthy primary API provider result

### Requirement: Explain market signal status in Chat
The Chat agent tools SHALL explain product market signal status using persisted market signal snapshots and provider health.

#### Scenario: Explain fresh market signals
- **WHEN** the agent explains an Amazon product with fresh Keepa market signals
- **THEN** the tool SHALL return provider `keepa`, source `third_party`, confidence, freshness, price trend, rank trend, review velocity, rating movement, and concise source reliability context

#### Scenario: Explain missing market signals
- **WHEN** the product has no market signal snapshots
- **THEN** the tool SHALL identify market trend signals as missing and suggest refreshing market signals or configuring Keepa

#### Scenario: Explain failed market signal refresh
- **WHEN** the latest market signal refresh failed
- **THEN** the tool SHALL return failure reason, root cause, safe diagnostics, and remediation guidance such as checking credentials, quota, ASIN mapping, or retry timing

### Requirement: Avoid unsupported market signal claims in Chat
The Chat agent SHALL avoid presenting market proxy signals as verified demand, sales, or profitability.

#### Scenario: Explain rank trend caveat
- **WHEN** Chat references Keepa sales rank trend
- **THEN** it SHALL identify the signal as rank trend evidence and SHALL NOT state a verified sales volume

#### Scenario: Explain review velocity caveat
- **WHEN** Chat references review velocity
- **THEN** it SHALL identify the signal as review activity evidence and SHALL NOT claim verified demand or conversion rate

#### Scenario: Explain combined opportunity
- **WHEN** Chat explains a product opportunity using acquisition health, market signals, and merchant business assumptions
- **THEN** it SHALL distinguish current listing reliability, external trend evidence, and merchant-entered profitability assumptions

### Requirement: Explain acquisition queue status in Chat
The Chat agent tools SHALL provide a read-only path for explaining acquisition queue and worker health.

#### Scenario: Explain healthy queue
- **WHEN** the user asks whether acquisition is running normally
- **THEN** the agent MAY call the queue health tool and SHALL summarize backend, backlog, worker health, provider gates, and caveat

#### Scenario: Explain delayed product job
- **WHEN** the user asks why a product has not refreshed
- **THEN** the agent SHALL explain the product job state, retry timing, worker state, provider gates, and latest acquisition attempt without starting a hidden refresh

#### Scenario: Explain provider gate
- **WHEN** queue health shows provider rate-limit or quota gating
- **THEN** the agent SHALL identify the affected provider/platform and suggest operational remediation such as checking credentials, quota, reset time, or concurrency settings

### Requirement: Avoid hidden queue mutations in Chat
The Chat agent SHALL NOT retry, cancel, reprioritize, or enqueue acquisition jobs without an explicit write workflow.

#### Scenario: User asks for diagnosis
- **WHEN** the user asks why data is stale, missing, delayed, or degraded
- **THEN** the agent SHALL read queue and attempt state without mutating jobs

#### Scenario: User asks to retry from Chat
- **WHEN** the user asks Chat to retry or cancel a job
- **THEN** the agent SHALL explain that the current Chat tool is read-only and direct job control must use the operations UI/API until an explicit confirmation workflow exists

### Requirement: Distinguish queue operations from opportunity signals in Chat
Chat explanations SHALL keep queue health separate from market, business, and opportunity evidence.

#### Scenario: Queue degraded while product score is high
- **WHEN** queue health is degraded for a high-scoring product
- **THEN** Chat SHALL explain that acquisition operations are degraded but SHALL NOT lower or reinterpret the product opportunity score as demand, sales, or profit evidence

### Requirement: Explain eBay acquisition status in Chat
The Chat agent tools SHALL explain eBay acquisition status using persisted eBay Browse attempts and provider health.

#### Scenario: Explain successful eBay acquisition
- **WHEN** the agent requests acquisition status for an eBay product with a recent successful Browse API attempt
- **THEN** the tool SHALL return provider `ebay-browse`, source `official_api`, confidence, timestamp, and concise source reliability context

#### Scenario: Explain failed eBay acquisition
- **WHEN** the latest eBay attempt failed
- **THEN** the tool SHALL return failure reason, root cause, safe diagnostics, and remediation guidance such as checking eBay credentials, item ID, marketplace, or rate limits

#### Scenario: Include eBay provider health
- **WHEN** the agent explains acquisition status for an eBay product
- **THEN** the tool SHALL include eBay provider health status and recommendations when available

### Requirement: Avoid unsupported eBay opportunity claims
The Chat agent SHALL avoid claiming eBay sales, demand, or verified profitability when eBay Browse data does not provide those facts.

#### Scenario: Explain eBay opportunity
- **WHEN** Chat explains an eBay product opportunity
- **THEN** it SHALL distinguish current listing data and provider health from demand, sales volume, margin, ROI, and merchant assumption metrics

#### Scenario: Missing eBay signals
- **WHEN** eBay opportunity scoring lacks business assumptions, demand signals, or stable acquisition history
- **THEN** Chat SHALL identify those missing signals and suggest collecting the relevant data before relying on the ranking

### Requirement: Explain business signals in opportunity tools
The Chat opportunity tools SHALL include assumption-based business metrics when explaining product opportunity scores.

#### Scenario: Explain complete business metrics
- **WHEN** the user asks why a product is a good or weak opportunity and the product has complete business metrics
- **THEN** the Chat tool response SHALL include net margin, ROI, breakeven sell price, contribution profit, price source, and a concise explanation of how those metrics influenced the score

#### Scenario: Explain missing business assumptions
- **WHEN** the product opportunity score lacks complete business assumptions
- **THEN** the Chat tool response SHALL identify the missing business signals and suggest adding the relevant assumptions before relying on profit or ROI analysis

#### Scenario: Avoid verified-profit claims
- **WHEN** Chat explains margin or ROI metrics
- **THEN** the explanation SHALL state that the values are calculated from merchant assumptions and are not verified sales, demand, or marketplace fee facts

### Requirement: Rank opportunities with business signal context
The Chat opportunity ranking tool SHALL expose business signal context for ranked opportunities.

#### Scenario: Return business summary in rankings
- **WHEN** the agent returns ranked product opportunities
- **THEN** each ranked item SHALL include business metric summaries when available and missing business signals when unavailable

#### Scenario: Support business readiness filtering
- **WHEN** the agent calls the opportunity ranking tool with a business readiness or minimum ROI filter
- **THEN** the tool SHALL return only products matching the filter and SHALL explain when no products match

### Requirement: Explain opportunity research state in Chat
The Chat agent tools SHALL be able to read and explain opportunity research workspace state.

#### Scenario: Explain shortlisted product
- **WHEN** the agent explains a product that has research metadata
- **THEN** the tool SHALL return research status, priority, tags, notes summary, and last updated timestamp alongside score and signal caveats

#### Scenario: Explain product without research entry
- **WHEN** the agent explains a product that is not in the research workspace
- **THEN** the tool SHALL state that no shortlist or research metadata exists for that product

### Requirement: List shortlisted opportunities in Chat
The Chat agent tools SHALL provide a read-only path for listing shortlisted opportunity candidates.

#### Scenario: List active shortlist
- **WHEN** the user asks for shortlisted or saved opportunities
- **THEN** the agent MAY call the read-only shortlist tool and SHALL return products with score, recommendation, research status, tags, priority, and key caveats

#### Scenario: Filter shortlist by status or tag
- **WHEN** the agent calls the shortlist tool with status or tag filters
- **THEN** the tool SHALL return only matching non-archived research entries

### Requirement: Avoid hidden research mutations in Chat
The Chat agent SHALL NOT mutate opportunity research state without an explicit write workflow.

#### Scenario: User asks for analysis
- **WHEN** the user asks the assistant to compare or explain shortlisted opportunities
- **THEN** the agent SHALL read existing research state without adding, removing, retagging, or archiving entries

#### Scenario: User asks to save an item
- **WHEN** the user asks Chat to save, tag, or archive an opportunity
- **THEN** the agent SHALL explain that the current tool can summarize research state but direct mutation must be done through the workspace UI until an explicit write tool exists

