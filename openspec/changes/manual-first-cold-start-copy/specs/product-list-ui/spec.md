## MODIFIED Requirements

### Requirement: Handle empty state
The system SHALL display appropriate manual-first messages when no products exist.

#### Scenario: Show empty state message
- **WHEN** no products exist in the database
- **THEN** system SHALL display an empty state message that invites the user to add the first product and establish a manual research sample
- **AND** the product list subtitle MUST describe the number of products added
- **AND** the empty state MUST NOT describe automatic monitoring as the default reason to add the first product

