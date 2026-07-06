## MODIFIED Requirements

### Requirement: Handle empty states
The system SHALL display appropriate messages when no alerts match criteria, distinguishing a cold-start workspace from an alert-free monitored workspace.

#### Scenario: Show empty state message
- **WHEN** no alerts match current filter
- **THEN** system SHALL display centered message "No alerts to display"

#### Scenario: Guide user when no products exist
- **WHEN** there are no products in the database and the all-alerts view is empty
- **THEN** system SHALL explain that alerts require products to monitor and SHALL provide a link or button to the products page

#### Scenario: Explain no-alert state when products exist
- **WHEN** products exist but no alerts match the current all-alerts view
- **THEN** system SHALL explain that alerts will appear after monitoring detects price or stock changes

#### Scenario: Preserve filtered empty guidance
- **WHEN** products exist and no alerts match a non-default filter
- **THEN** system SHALL ask the user to adjust filters rather than directing them to add products
