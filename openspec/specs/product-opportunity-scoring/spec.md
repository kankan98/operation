# Product Opportunity Scoring

## Purpose

This capability turns monitored product, price, acquisition, and metadata signals into transparent opportunity scores so merchants can prioritize product research without overstating unsupported profit, sales, or demand claims.
## Requirements
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

### Requirement: Include market trend signals in opportunity scoring
The opportunity scoring service SHALL use available market signal snapshots as explicit scoring factors and confidence inputs.

#### Scenario: Score product with fresh market signals
- **WHEN** a product has a fresh market signal snapshot with price trend, rank trend, review velocity, and rating movement
- **THEN** the opportunity score SHALL include named market trend factors with raw values, normalized contribution, weight, direction, and explanation text

#### Scenario: Score product with stale market signals
- **WHEN** a product has market signal snapshots older than the configured freshness window
- **THEN** the scoring service SHALL reduce confidence and include missing or stale market signal names without treating the product as automatically unattractive

#### Scenario: Score product without market signals
- **WHEN** a product has no market signal snapshots
- **THEN** the scoring service SHALL keep returning deterministic opportunity scores and SHALL include market trend signals in the missing signals list

### Requirement: Avoid overstating market proxy signals
The opportunity scoring service SHALL distinguish market trend proxy signals from verified sales, demand, margin, ROI, and profitability facts.

#### Scenario: Use sales rank trend as proxy
- **WHEN** scoring uses Keepa sales rank trend data
- **THEN** the factor explanation SHALL label it as rank trend evidence and SHALL NOT convert it to verified sales volume

#### Scenario: Use review velocity as proxy
- **WHEN** scoring uses review count velocity
- **THEN** the factor explanation SHALL label it as review activity evidence and SHALL NOT claim verified demand or sales velocity

#### Scenario: Preserve merchant assumption boundaries
- **WHEN** market signals and merchant business assumptions are both present
- **THEN** the scoring service SHALL keep trend evidence separate from cost, margin, ROI, breakeven, and contribution-profit calculations

### Requirement: Use business metrics in opportunity scoring
The opportunity scoring service SHALL use assumption-based business metrics as scoring factors when enough inputs exist.

#### Scenario: Score with complete business metrics
- **WHEN** a product has complete business assumptions and computed margin/ROI metrics
- **THEN** the scoring result SHALL include business factors for net margin, ROI, breakeven distance, and contribution profit in the factor breakdown

#### Scenario: Preserve deterministic scoring with business metrics
- **WHEN** the same product, price history, acquisition history, and business assumptions are scored repeatedly
- **THEN** the scoring service SHALL return the same score, confidence, factor breakdown, missing signals, and recommendation

#### Scenario: Avoid favorable scoring from missing costs
- **WHEN** business assumptions are incomplete
- **THEN** the scoring service SHALL mark missing business signals and SHALL NOT treat missing cost, fee, shipping, advertising, or tax fields as zero-cost advantages

### Requirement: Adjust scoring confidence for business completeness
The opportunity scoring service SHALL adjust confidence based on whether business assumptions are sufficient for margin and ROI analysis.

#### Scenario: Increase confidence from complete assumptions
- **WHEN** a product has complete business assumptions and valid derived metrics
- **THEN** scoring confidence SHALL reflect that margin and ROI signals are available

#### Scenario: Reduce confidence from missing assumptions
- **WHEN** required business assumptions are missing
- **THEN** scoring confidence SHALL remain reduced and missing signals SHALL identify the absent assumptions

### Requirement: Recommend actions from business metrics
The opportunity scoring service SHALL incorporate business metrics into recommended actions without replacing data-health recommendations.

#### Scenario: Recommend investigate for strong metrics
- **WHEN** a product has healthy acquisition data, sufficient confidence, positive net margin, and ROI above the configured investigation threshold
- **THEN** the recommended action MAY be `investigate` and the explanation SHALL cite the assumption-based metrics

#### Scenario: Recommend ignore for weak metrics
- **WHEN** a product has complete assumptions but negative net margin or ROI below the configured ignore threshold
- **THEN** the recommended action MAY be `ignore` and the explanation SHALL cite the weak business metrics

#### Scenario: Recommend check data for incomplete metrics
- **WHEN** business assumptions are incomplete and other scoring signals cannot justify a high-confidence recommendation
- **THEN** the recommended action MAY be `check_data` and the explanation SHALL identify the missing business assumptions

### Requirement: Include research metadata with opportunity responses
The opportunity scoring APIs SHALL include optional research metadata alongside opportunity results without using that metadata to calculate scores.

#### Scenario: List opportunity with research metadata
- **WHEN** a product has an opportunity research entry
- **THEN** opportunity list responses SHALL include research status, priority, tags, notes summary, archived flag, and updated timestamp for that product

#### Scenario: Explain opportunity with research metadata
- **WHEN** a client requests a single product opportunity explanation
- **THEN** the response SHALL include the product's research metadata when present

#### Scenario: Score ignores research metadata
- **WHEN** research status, priority, tags, or notes change for a product
- **THEN** the product's opportunity score, factor contributions, and recommendation SHALL remain determined only by scoring inputs, not research metadata

### Requirement: Filter opportunities by research state
The opportunity APIs SHALL allow clients to filter opportunity lists by research workflow state.

#### Scenario: Filter by shortlisted state
- **WHEN** a client requests only shortlisted opportunities
- **THEN** the API SHALL return products that have non-archived research entries

#### Scenario: Filter by research status
- **WHEN** a client provides a research status filter
- **THEN** the API SHALL return only products with matching research status

#### Scenario: Filter by tag
- **WHEN** a client provides a research tag filter
- **THEN** the API SHALL return only products whose normalized tags include that value

