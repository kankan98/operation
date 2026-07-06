## ADDED Requirements

### Requirement: Localize market signal card status display
The product detail market signal card SHALL render known market signal status, Keepa health status, metric labels, history table headers, and default caveat text with readable Chinese display labels rather than raw internal or English strings.

#### Scenario: Missing market signal status is readable
- **WHEN** the product detail market signal card has no latest market signal snapshot
- **THEN** the status badge SHALL display a Chinese missing-state label
- **AND** the raw `missing` status SHALL NOT be displayed as the badge text

#### Scenario: Keepa health status is readable
- **WHEN** the product detail market signal card displays Keepa provider health with status `insufficient_history`
- **THEN** the health badge SHALL display a Chinese status label while preserving the `Keepa` provider label
- **AND** the raw `insufficient_history` status SHALL NOT be displayed as the badge text

#### Scenario: Market signal snapshot labels are readable
- **WHEN** the product detail market signal card displays a latest market signal snapshot and history rows
- **THEN** the KPI labels, history headers, and default caveat SHALL be readable Chinese labels
- **AND** raw English labels such as `Confidence`, `Freshness`, `Snapshot`, and the default English caveat SHALL NOT be displayed
