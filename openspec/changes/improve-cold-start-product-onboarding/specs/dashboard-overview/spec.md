## ADDED Requirements

### Requirement: Guide cold-start users from dashboard
The dashboard SHALL guide users to the first product setup action when there are no products.

#### Scenario: Show dashboard cold-start action
- **WHEN** user views the dashboard and total product count is 0
- **THEN** system SHALL show guidance that product monitoring starts by adding a product and SHALL provide a link or button to the products page

#### Scenario: Preserve metrics during cold start
- **WHEN** user views the dashboard and total product count is 0
- **THEN** system SHALL still display the zero-value KPI metrics without chart warnings or layout errors
