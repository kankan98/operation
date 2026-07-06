## MODIFIED Requirements

### Requirement: Display price statistics
The system SHALL show price analysis statistics from the analysis API and SHALL present no-snapshot cold-start statistics as missing data rather than as real zero prices.

#### Scenario: Show current price card
- **WHEN** viewing product with price data
- **THEN** system SHALL display current price in a metric card

#### Scenario: Show lowest price card
- **WHEN** viewing product with price data
- **THEN** system SHALL display lowest price in green color in a metric card

#### Scenario: Show highest price card
- **WHEN** viewing product with price data
- **THEN** system SHALL display highest price in red color in a metric card

#### Scenario: Show price change percentage card
- **WHEN** viewing product with price data
- **THEN** system SHALL display price change percentage with green color for negative changes (price drop) and red color for positive changes (price increase)

#### Scenario: Handle product with no price data
- **WHEN** viewing product with no price snapshots
- **THEN** system SHALL display missing-data labels such as "暂无读数" or "缺失" in price statistic cards
- **AND** system SHALL NOT display `$0.00` or another zero value as if it were a recorded current price

## ADDED Requirements

### Requirement: Guide business assumption completion
The product detail UI SHALL make business assumption inputs understandable and SHALL confirm successful saves.

#### Scenario: Explain referral fee rate input
- **WHEN** the business assumptions form is shown
- **THEN** the referral fee rate field SHALL explain that users may enter either a percent such as `12` or a fraction such as `0.12`

#### Scenario: Show business assumption save success
- **WHEN** business assumptions are saved successfully
- **THEN** the product detail page SHALL show a visible aria-live success message confirming the assumptions were saved

#### Scenario: Clear stale save success on edit
- **WHEN** the user edits a business assumption after a successful save
- **THEN** the previous save success message SHALL be cleared before the next save
