## ADDED Requirements

### Requirement: Trigger manual acquisition from product detail
The product detail page SHALL allow users to trigger manual product data acquisition through the scraper acquisition API.

#### Scenario: User clicks check now
- **WHEN** the user clicks the product detail "check now" action
- **THEN** the frontend SHALL call `POST /api/scraper/product/:productId`

#### Scenario: Successful manual acquisition refreshes product data
- **WHEN** manual acquisition succeeds
- **THEN** the page SHALL refresh product details, price statistics, price snapshots, and recent acquisition attempts

#### Scenario: Failed manual acquisition shows structured result
- **WHEN** manual acquisition returns success=false
- **THEN** the page SHALL show the failure reason and keep the product detail page usable

### Requirement: Display recent acquisition attempts
The product detail page SHALL display recent acquisition attempts for the current product.

#### Scenario: Show attempt list
- **WHEN** product detail loads for a valid product
- **THEN** the page SHALL request recent attempts from `GET /api/scraper/product/:productId/attempts`

#### Scenario: Show attempt summary fields
- **WHEN** attempts are available
- **THEN** the page SHALL display provider, source, status, failure reason, confidence, duration, and timestamp for each attempt

#### Scenario: Show safe diagnostics
- **WHEN** an attempt contains diagnostic metadata
- **THEN** the page SHALL display only safe diagnostic summary fields such as page title, final URL, detected state, HTTP status, or provider error code

#### Scenario: Empty attempt history
- **WHEN** a product has no acquisition attempts
- **THEN** the page SHALL show an empty state instead of hiding acquisition status entirely

### Requirement: Track manual acquisition job state
The product detail page SHALL expose job or attempt identifiers returned by manual acquisition.

#### Scenario: Result includes job ID
- **WHEN** manual acquisition returns a job ID
- **THEN** the page SHALL display or retain the job ID so the user can correlate the result with attempt history

#### Scenario: Result includes attempt ID
- **WHEN** manual acquisition returns an attempt ID
- **THEN** the page SHALL highlight or surface the matching attempt in recent acquisition history
