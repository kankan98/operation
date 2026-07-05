## ADDED Requirements

### Requirement: Price statistics carry source provenance
The price statistics response SHALL include provenance for the current price, derived from the latest snapshot's source and timestamp, so that no price number is presented without its origin and freshness. Provenance SHALL be computed on the backend (single source of truth) and SHALL include source, age, stale flag, trust level, and a human-readable label.

#### Scenario: Fresh manual reading provenance
- **WHEN** `getPriceStats` is called for a product whose latest snapshot is a recent `manual` reading within the freshness window
- **THEN** the response SHALL include a `provenance` object with `source: 'manual'`, `stale: false`, and `trust: 'high'`

#### Scenario: Stale reading is not presented as verified
- **WHEN** the latest snapshot is older than its source freshness threshold (e.g. a manual reading older than 7 days)
- **THEN** the `provenance` SHALL report `stale: true`, a downgraded `trust`, and a `label` indicating the value may be outdated and should be re-checked

#### Scenario: Provenance reflects the actual source of the latest reading
- **WHEN** the latest snapshot source is a low-trust origin such as `cache` or `unknown`
- **THEN** the `provenance.source` SHALL reflect that origin and `trust` SHALL be no higher than the source's defined ceiling
