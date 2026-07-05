## ADDED Requirements

### Requirement: Opportunity listing evaluates all matching products
The opportunity listing service SHALL evaluate all products matching the requested base filters before applying scoring, research, and pagination filters.

#### Scenario: Matching products exceed one internal batch
- **WHEN** more products match platform or monitoring filters than fit in one internal processing batch
- **THEN** the opportunity list SHALL continue processing subsequent batches and SHALL NOT silently omit later products

#### Scenario: Pagination is applied after scoring filters
- **WHEN** the ranked opportunity list is requested with page and limit parameters
- **THEN** pagination metadata SHALL reflect the total scored and filtered opportunity set rather than only the first internal batch
