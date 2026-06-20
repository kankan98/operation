## ADDED Requirements

### Requirement: Display Amazon provider health
The product detail page SHALL display Amazon provider health when viewing an Amazon product with available provider health data.

#### Scenario: Show provider health summary
- **WHEN** an Amazon product detail page loads
- **THEN** the page SHALL request Amazon provider health for that product and show provider status, attempt count, fallback count, cache count, primary failure count, and recommendations when available

#### Scenario: Label degraded fallback paths
- **WHEN** the latest acquisition result or provider health indicates browser fallback or cache fallback usage
- **THEN** the page SHALL label the data-source path as degraded instead of presenting it as healthy primary provider coverage

#### Scenario: Keep page usable without provider health
- **WHEN** provider health data is unavailable or insufficient
- **THEN** the product detail page SHALL continue to show product details and recent attempts without blocking the main view
