## ADDED Requirements

### Requirement: Empty monitoring overview chart renders stably
The dashboard monitoring overview chart SHALL render a stable empty state when all product counts are zero.

#### Scenario: Empty product counts render without chart sizing warnings
- **WHEN** the dashboard product dataset is empty or every monitoring segment has value `0`
- **THEN** the monitoring overview chart SHALL not mount a zero-size Recharts responsive container
- **AND** no Recharts width/height warning SHALL be emitted

#### Scenario: Empty chart keeps center summary visible
- **WHEN** the monitoring overview chart renders the empty state
- **THEN** the chart SHALL still display the configured center value and center label

#### Scenario: Non-empty chart remains interactive chart output
- **WHEN** at least one monitoring segment has a value greater than `0`
- **THEN** the chart SHALL continue to render through the existing Recharts donut implementation
