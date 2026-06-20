## ADDED Requirements

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
