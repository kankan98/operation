## ADDED Requirements

### Requirement: Compute product opportunity scores
The system SHALL compute a transparent opportunity score for products using available monitoring, price, acquisition, and product metadata signals.

#### Scenario: Score product with available signals
- **WHEN** a product has current price, price snapshots, recent acquisition attempts, and metadata signals
- **THEN** the scoring service SHALL return an opportunity score from 0 to 100, confidence from 0 to 1, factor breakdowns, and a recommended action

#### Scenario: Score product with missing signals
- **WHEN** a product lacks one or more scoring signals
- **THEN** the scoring service SHALL still return a score and SHALL include missing signal names with reduced confidence

#### Scenario: Keep scoring deterministic
- **WHEN** the same product inputs are scored repeatedly
- **THEN** the scoring service SHALL return the same score, factor breakdown, confidence, and recommendation

### Requirement: Explain score factors
The system SHALL explain why each opportunity score was assigned.

#### Scenario: Return factor breakdown
- **WHEN** an opportunity score is returned
- **THEN** the result SHALL include named factors with raw value, normalized contribution, weight, direction, and explanation text

#### Scenario: Separate score from confidence
- **WHEN** a product has strong signals but incomplete data
- **THEN** the result SHALL expose score and confidence as separate fields

#### Scenario: Recommend next action
- **WHEN** the scoring service evaluates a product
- **THEN** it SHALL recommend one of `watch`, `investigate`, `check_data`, or `ignore`

### Requirement: List ranked opportunities
The system SHALL expose a read-only API for listing products ranked by opportunity score.

#### Scenario: Get ranked products
- **WHEN** a client requests the opportunity product list
- **THEN** the API SHALL return products ordered by score descending by default

#### Scenario: Filter opportunity products
- **WHEN** a client provides platform, category, monitoring status, minimum score, or recommended action filters
- **THEN** the API SHALL return only matching products

#### Scenario: Paginate opportunity products
- **WHEN** the ranked opportunity list contains more products than the requested limit
- **THEN** the API SHALL return pagination metadata and only the requested page of results

### Requirement: Explain one product opportunity
The system SHALL expose a read-only API for explaining the opportunity score for a single product.

#### Scenario: Explain existing product
- **WHEN** a client requests opportunity explanation for an existing product
- **THEN** the API SHALL return product summary, score, confidence, factors, missing signals, and recommended action

#### Scenario: Explain missing product
- **WHEN** a client requests opportunity explanation for a product ID that does not exist
- **THEN** the API SHALL return a product-not-found error

### Requirement: Avoid unsupported signal claims
The system SHALL avoid presenting unavailable demand, sales, fee, or profit signals as facts.

#### Scenario: Margin data unavailable
- **WHEN** cost, fee, shipping, or sales data is unavailable
- **THEN** the scoring explanation SHALL mark margin or demand signals as missing rather than estimating them as facts

#### Scenario: Review signal available
- **WHEN** rating or review count is available from product or snapshot data
- **THEN** the scoring explanation MAY use it as a proxy signal and SHALL label it as a proxy
