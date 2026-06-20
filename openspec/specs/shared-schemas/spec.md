## Purpose

Shared schemas define reusable Zod contracts and inferred TypeScript types shared by backend, frontend, and generated API documentation.
## Requirements
### Requirement: Product Schema Definition
The system SHALL define a Zod schema for Product entity that includes all fields from the database schema with appropriate validation rules.

#### Scenario: Product schema validates required fields
- **WHEN** a product creation request is submitted without required fields (platform, productUrl, asin, title)
- **THEN** Zod validation rejects the request with detailed field-level errors

#### Scenario: Product schema enforces field constraints
- **WHEN** a product creation request includes a title exceeding 500 characters
- **THEN** Zod validation rejects the request indicating the maximum length violation

#### Scenario: Product schema provides type inference
- **WHEN** TypeScript code imports the product schema
- **THEN** type definitions are automatically inferred using `z.infer<typeof schema>`

### Requirement: Alert Schema Definition
The system SHALL define a Zod schema for Alert entity that validates alert types, severity levels, and required fields.

#### Scenario: Alert schema validates severity enum
- **WHEN** an alert creation request includes an invalid severity value
- **THEN** Zod validation rejects the request with allowed severity values (info, warning, critical)

#### Scenario: Alert schema enforces message length
- **WHEN** an alert creation request includes a message exceeding 1000 characters
- **THEN** Zod validation rejects the request indicating the maximum length violation

### Requirement: Alert Rule Schema Definition
The system SHALL define a Zod schema for AlertRule entity that validates rule types, conditions, and threshold values.

#### Scenario: Alert rule schema validates threshold
- **WHEN** an alert rule creation request includes a negative threshold for price_threshold type
- **THEN** Zod validation rejects the request requiring a positive number

#### Scenario: Alert rule schema validates rule type and condition compatibility
- **WHEN** an alert rule creation request includes incompatible ruleType and condition combinations
- **THEN** Zod validation accepts valid combinations and provides clear type inference

### Requirement: Price Snapshot Schema Definition
The system SHALL define a Zod schema for PriceSnapshot entity that validates price data, availability status, and timestamp.

#### Scenario: Price snapshot schema validates availability enum
- **WHEN** a price snapshot includes an invalid availability value
- **THEN** Zod validation rejects the request with allowed availability values (in_stock, low_stock, out_of_stock)

#### Scenario: Price snapshot schema validates numeric fields
- **WHEN** a price snapshot includes a negative price value
- **THEN** Zod validation rejects the request requiring a positive number

### Requirement: Shared Schema Package Structure
The system SHALL organize schemas in a shared package that can be imported by both frontend and backend.

#### Scenario: Backend imports shared schemas
- **WHEN** backend code imports from `@shared/schemas`
- **THEN** TypeScript resolves the path correctly and provides full type inference

#### Scenario: Frontend imports shared schemas
- **WHEN** frontend code imports from `@shared/schemas`
- **THEN** TypeScript resolves the path correctly and provides full type inference

### Requirement: Schema Versioning
The system SHALL maintain schema definitions in a way that supports future versioning without breaking existing code.

#### Scenario: Schema exports types and validators
- **WHEN** a module imports a schema
- **THEN** both the Zod validator and inferred TypeScript types are available for use

### Requirement: Define market signal schemas
The shared schema package SHALL define reusable market signal schemas for backend, frontend, and OpenAPI generation.

#### Scenario: Validate market signal snapshot
- **WHEN** a response includes a market signal snapshot
- **THEN** shared schemas SHALL validate provider, source, product ID, platform, ASIN, window, confidence, freshness, trend summaries, missing signals, metadata, and timestamps

#### Scenario: Validate market signal refresh result
- **WHEN** a market signal refresh succeeds or fails
- **THEN** shared schemas SHALL validate success, provider, source, snapshot ID when available, failure reason, root cause, diagnostics, confidence, duration, and timestamp

#### Scenario: Validate market signal provider health
- **WHEN** a market signal provider health response is returned
- **THEN** shared schemas SHALL validate health status, provider summaries, failure distribution, root causes, latest attempts, and recommendations

### Requirement: Extend opportunity schemas with market signals
The shared schema package SHALL support opportunity responses that include market signal factors and caveats.

#### Scenario: Opportunity includes market signal factors
- **WHEN** opportunity responses include market trend factors
- **THEN** shared schemas SHALL accept factor names, raw values, normalized contribution, confidence impact, source, freshness, and explanation text

#### Scenario: Market signal fields remain optional
- **WHEN** opportunity responses do not include market signal data
- **THEN** shared schemas SHALL remain compatible and SHALL NOT require market signal fields for products without refreshed market signals

### Requirement: Preserve bounded market diagnostic values
The shared schema package SHALL restrict market signal diagnostics to bounded values that do not leak secrets.

#### Scenario: Validate bounded root causes
- **WHEN** Keepa diagnostics include root causes such as `missing_credentials`, `auth_failed`, `quota_exhausted`, `rate_limited`, `not_found`, `unsupported_product`, `insufficient_history`, `network_timeout`, or `unknown`
- **THEN** shared schemas SHALL validate those bounded values without accepting arbitrary high-cardinality secret fields

#### Scenario: Reject unsafe diagnostic payloads
- **WHEN** market signal diagnostics include raw API keys, authorization headers, or raw provider payload fields
- **THEN** shared schema tests SHALL fail unless the values are redacted or omitted

### Requirement: Define acquisition queue operation schemas
The shared schema package SHALL define reusable queue operation schemas and inferred types.

#### Scenario: Validate queue health response
- **WHEN** a queue health response is returned
- **THEN** shared schemas SHALL validate backend, status, backlog counts, job counts, worker summary, provider gate summary, recommendations, caveat, and timestamp

#### Scenario: Validate worker heartbeat
- **WHEN** a worker heartbeat is recorded or returned
- **THEN** shared schemas SHALL validate worker ID, backend, status, concurrency, active job count, queues, timestamps, and safe metadata

#### Scenario: Validate product job diagnostics
- **WHEN** product job diagnostics are returned
- **THEN** shared schemas SHALL validate nullable job state, attempt summary, retry timing, lease fields, provider gate context, and caveat

### Requirement: Define queue job control schemas
The shared schema package SHALL define request and response schemas for acquisition job control.

#### Scenario: Validate retry request
- **WHEN** a retry request is submitted
- **THEN** shared schemas SHALL validate job ID, optional reason, and bounded operator note

#### Scenario: Validate cancel request
- **WHEN** a cancel request is submitted
- **THEN** shared schemas SHALL validate job ID, cancellation reason, and bounded operator note

#### Scenario: Validate provider limit state
- **WHEN** provider operational limit state is returned
- **THEN** shared schemas SHALL validate platform, provider, status, reset time, concurrency, active count, recent root causes, and recommendations

### Requirement: Preserve queue diagnostic safety
The shared schema package SHALL reject unsafe queue diagnostic fields.

#### Scenario: Reject secret diagnostics
- **WHEN** queue diagnostics include Redis URL credentials, API keys, authorization headers, cookies, raw provider payload, or raw HTML
- **THEN** shared schema tests SHALL fail unless those values are redacted or omitted

### Requirement: Extend provider metadata schemas for eBay
The shared schema package SHALL validate eBay provider metadata returned by acquisition, health, and opportunity APIs.

#### Scenario: Validate eBay provider fields
- **WHEN** a response includes provider metadata for eBay Browse acquisition
- **THEN** shared schemas SHALL accept provider `ebay-browse`, source `official_api`, confidence, attempt ID, and safe diagnostics

#### Scenario: Validate eBay diagnostic root causes
- **WHEN** eBay diagnostics include root causes such as `missing_credentials`, `auth_failed`, `rate_limited`, `quota_exhausted`, `not_found`, `marketplace_mismatch`, `price_missing`, or `unknown`
- **THEN** shared schemas SHALL validate those bounded values without allowing arbitrary high-cardinality secrets

### Requirement: Preserve cross-platform acquisition compatibility
The shared schema package SHALL preserve existing Amazon acquisition response compatibility while adding eBay provider metadata.

#### Scenario: Existing Amazon responses remain valid
- **WHEN** existing Amazon Rainforest or browser acquisition responses are validated
- **THEN** shared schemas SHALL continue to accept them without requiring eBay-specific fields

#### Scenario: eBay responses remain optional in opportunity data
- **WHEN** opportunity responses include products without eBay acquisition metadata
- **THEN** shared schemas SHALL remain compatible and SHALL NOT require eBay fields for non-eBay products

### Requirement: Define business signal schemas
The shared schema package SHALL define reusable Zod schemas and inferred TypeScript types for product business assumptions and derived metrics.

#### Scenario: Validate business signal upsert request
- **WHEN** frontend or backend code validates a business signal upsert request
- **THEN** the shared schema SHALL enforce product ID, supported currency, non-negative monetary fields, referral fee rate bounds, optional notes length, and optional target units constraints

#### Scenario: Infer business signal request type
- **WHEN** TypeScript code imports the business signal upsert schema
- **THEN** the corresponding inferred type SHALL be available from the shared schema package

#### Scenario: Validate derived metrics response
- **WHEN** backend or frontend code validates a derived business metrics response
- **THEN** the shared schema SHALL cover gross margin, net margin, ROI, breakeven sell price, contribution profit per unit, total variable cost, completeness, missing signals, price source, and assumption-based caveat

### Requirement: Extend opportunity schemas with business metrics
The shared schema package SHALL extend opportunity response contracts with optional business signal summaries.

#### Scenario: Opportunity list includes business summary
- **WHEN** an opportunity list response includes business metrics
- **THEN** the shared opportunity schema SHALL validate the business summary and preserve compatibility for products without saved assumptions

#### Scenario: Opportunity explanation includes business factors
- **WHEN** an opportunity explanation includes business metric factor breakdowns
- **THEN** the shared opportunity schema SHALL validate the factors, missing business signals, and assumption caveats

### Requirement: Define opportunity research schemas
The shared schema package SHALL define reusable schemas and types for opportunity research workspace entities.

#### Scenario: Validate research entry
- **WHEN** a response includes an opportunity research entry
- **THEN** shared schemas SHALL validate product ID, status, priority, tags, notes, archived flag, created timestamp, and updated timestamp

#### Scenario: Validate research update payload
- **WHEN** a client updates research status, tags, priority, notes, or archived state
- **THEN** shared schemas SHALL validate supported enum values, bounded tag count, bounded tag length, and bounded notes length

#### Scenario: Validate optional research metadata on opportunities
- **WHEN** opportunity responses include research metadata
- **THEN** shared schemas SHALL accept the metadata without requiring it for products that are not shortlisted

### Requirement: Define opportunity comparison schemas
The shared schema package SHALL define schemas for comparing researched opportunities.

#### Scenario: Validate comparison request
- **WHEN** a comparison request includes product IDs
- **THEN** shared schemas SHALL validate a bounded non-empty product ID list

#### Scenario: Validate comparison response
- **WHEN** a comparison response is returned
- **THEN** shared schemas SHALL validate product summary, score, confidence, recommendation, research metadata, acquisition health, market signals, business signals, missing signals, and caveats

### Requirement: Define opportunity export schemas
The shared schema package SHALL define schemas for opportunity research export requests and rows.

#### Scenario: Validate export request
- **WHEN** a client requests opportunity research export
- **THEN** shared schemas SHALL validate format, selected product IDs or filters, and bounded export limits

#### Scenario: Validate export row
- **WHEN** export rows are returned as JSON or produced for CSV
- **THEN** shared schemas SHALL validate product identity, platform, price, score, confidence, recommendation, research state, tags, top reasons, missing signals, and caveat fields

