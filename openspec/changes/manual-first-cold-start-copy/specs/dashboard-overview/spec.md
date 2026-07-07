## ADDED Requirements

### Requirement: Present manual-first zero-product cold start
The dashboard SHALL guide users without products toward creating a manual research sample before alerts or opportunities are expected.

#### Scenario: Show manual-first dashboard cold start
- **WHEN** the dashboard loads with zero products
- **THEN** the dashboard MUST display a cold-start title that tells the user to add a product to establish a research sample
- **AND** the cold-start description MUST explain that the user records key readings manually first
- **AND** the cold-start copy MUST NOT describe automatic monitoring as the required first step

