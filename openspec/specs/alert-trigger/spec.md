# Alert Trigger Specification

## Purpose

This capability provides automated alert rule evaluation and generation, triggering alerts when monitored products meet configured conditions.

---

## Requirements

### Requirement: Evaluate price threshold rules
The system SHALL evaluate price threshold rules after product scraping.

#### Scenario: Trigger alert when price drops below threshold
- **WHEN** product has rule "price below 50" and current price is 45
- **THEN** system SHALL create alert with type "price_threshold", severity from rule, and price data

#### Scenario: Trigger alert when price rises above threshold
- **WHEN** product has rule "price above 100" and current price is 110
- **THEN** system SHALL create alert with appropriate message

#### Scenario: No alert when threshold not met
- **WHEN** product has rule "price below 50" and current price is 60
- **THEN** system SHALL NOT create alert

### Requirement: Evaluate price change percent rules
The system SHALL evaluate price change percentage rules after product scraping.

#### Scenario: Trigger alert on price drop percentage
- **WHEN** product has rule "decrease by 10%" and price dropped from 100 to 85
- **THEN** system SHALL create alert showing 15% decrease

#### Scenario: Trigger alert on price increase percentage
- **WHEN** product has rule "increase by 20%" and price rose from 100 to 125
- **THEN** system SHALL create alert showing 25% increase

#### Scenario: No alert when change below threshold
- **WHEN** product has rule "decrease by 10%" and price dropped only 5%
- **THEN** system SHALL NOT create alert

#### Scenario: Require at least two snapshots
- **WHEN** product has only 1 snapshot
- **THEN** system SHALL skip price change rules (cannot calculate change)

### Requirement: Evaluate stock change rules
The system SHALL evaluate stock availability change rules after product scraping.

#### Scenario: Trigger alert when stock becomes unavailable
- **WHEN** product has stock_change rule and availability changes from "in_stock" to "out_of_stock"
- **THEN** system SHALL create alert with type "stock_change"

#### Scenario: Trigger alert when stock becomes available
- **WHEN** product has stock_change rule and availability changes from "out_of_stock" to "in_stock"
- **THEN** system SHALL create alert notifying stock replenishment

#### Scenario: No alert when availability unchanged
- **WHEN** availability remains "in_stock" across snapshots
- **THEN** system SHALL NOT create alert

### Requirement: Respect rule enabled status
The system SHALL only evaluate rules that are enabled.

#### Scenario: Skip disabled rules
- **WHEN** product has rule with enabled=false
- **THEN** system SHALL NOT evaluate this rule

#### Scenario: Evaluate only enabled rules
- **WHEN** product has 3 rules but only 2 enabled
- **THEN** system SHALL evaluate exactly 2 rules

### Requirement: Avoid duplicate alerts
The system SHALL not create duplicate alerts for the same condition.

#### Scenario: Prevent repeated threshold alerts
- **WHEN** price remains below threshold across multiple scrapes
- **THEN** system SHALL create alert only on first detection, not subsequent scrapes

#### Scenario: Allow new alert after condition clears
- **WHEN** price drops below threshold, then rises above, then drops again
- **THEN** system SHALL create two separate alerts (condition cleared between)
