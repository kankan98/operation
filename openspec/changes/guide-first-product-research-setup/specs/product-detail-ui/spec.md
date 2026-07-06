## ADDED Requirements

### Requirement: Guide first research setup after product creation
The product detail UI SHALL show a transient first-research setup guide when the user arrives immediately after creating a product.

#### Scenario: Show setup guide from create flow
- **WHEN** product detail is opened with first-setup route state from product creation
- **THEN** the page SHALL display a compact guide explaining that the next setup steps are recording a manual reading, filling business assumptions, and reviewing opportunities after signals exist

#### Scenario: Link guide actions to existing workflow sections
- **WHEN** the setup guide is shown
- **THEN** it SHALL provide actions targeting the manual reading section, the business assumptions section, and the opportunities page

#### Scenario: Avoid showing guide on direct detail visits
- **WHEN** product detail is opened without first-setup route state
- **THEN** the page SHALL render the normal product detail view without the first-research setup guide

#### Scenario: Dismiss setup guide
- **WHEN** the setup guide is visible and the user dismisses it
- **THEN** the guide SHALL be hidden for the current detail-page session without changing product data
