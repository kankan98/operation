## ADDED Requirements

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
