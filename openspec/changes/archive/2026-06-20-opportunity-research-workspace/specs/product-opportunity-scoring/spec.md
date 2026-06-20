## ADDED Requirements

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
