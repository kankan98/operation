## MODIFIED Requirements

### Requirement: Handle empty states
The system SHALL display appropriate messages when no alerts match criteria or when alerts do not yet have product and reading signals to evaluate.

#### Scenario: Show empty state message
- **WHEN** no alerts match current filter
- **THEN** system SHALL display centered message "No alerts to display"

#### Scenario: Show no-products prerequisite message
- **WHEN** no products exist for alert evaluation
- **THEN** system SHALL explain that alerts need a product and reading history first
- **AND** system SHALL tell the user that manual readings or optional monitoring can create price and stock signals
- **AND** the message MUST NOT imply that automatic monitoring is the only prerequisite
