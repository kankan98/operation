## ADDED Requirements

### Requirement: Display product acquisition job health
The product detail page SHALL display queue and job health for the current product.

#### Scenario: Show active job state
- **WHEN** a product has an active acquisition job
- **THEN** the page SHALL show job status, attempt count, next run time, lease state, provider gate context, and latest attempt summary

#### Scenario: Show delayed job state
- **WHEN** a product job is delayed by retry backoff, provider rate limit, quota exhaustion, or worker unavailability
- **THEN** the page SHALL show the delay reason and remediation guidance without blocking product detail data

#### Scenario: Show no job state
- **WHEN** a product has no acquisition job history
- **THEN** the page SHALL show a neutral empty operational state

### Requirement: Expose safe product job controls
The product detail page SHALL expose bounded retry and cancel actions when job state allows them.

#### Scenario: Retry failed job from product detail
- **WHEN** a product job is failed or cancelled
- **THEN** the page SHALL show a retry action that calls the job control API and refreshes product job diagnostics

#### Scenario: Cancel pending job from product detail
- **WHEN** a product job is pending or retry-scheduled
- **THEN** the page SHALL show a cancel action that calls the job control API and refreshes product job diagnostics

#### Scenario: Hide unsafe controls
- **WHEN** a job state does not support retry or cancel
- **THEN** the page SHALL hide or disable the unsupported action with a concise state-specific reason

### Requirement: Label queue health as operational context
The product detail page SHALL distinguish queue operations from product quality or opportunity evidence.

#### Scenario: Queue caveat visible
- **WHEN** product job or queue health is shown
- **THEN** the page SHALL display a caveat that queue health explains acquisition operations and is not evidence of sales, demand, margin, ROI, or profitability
