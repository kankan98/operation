## ADDED Requirements

### Requirement: Define products table schema
The system SHALL provide a products table that stores monitored product information with all necessary fields for tracking e-commerce products.

#### Scenario: Products table exists with required fields
- **WHEN** the database is initialized
- **THEN** a products table SHALL exist with fields: id, platform, productUrl, asin, title, brand, category, imageUrl, currentPrice, currency, isMonitoring, monitorType, checkInterval, userId, createdAt, updatedAt, lastCheckedAt, metadata

#### Scenario: Product URL is unique
- **WHEN** attempting to insert a product with duplicate productUrl
- **THEN** the database SHALL reject the insertion with a unique constraint violation

### Requirement: Define price_snapshots table schema
The system SHALL provide a price_snapshots table that stores historical price and product data for trend analysis.

#### Scenario: Price snapshots table exists
- **WHEN** the database is initialized
- **THEN** a price_snapshots table SHALL exist with fields: id, productId, price, originalPrice, discountRate, rating, reviewsCount, salesRank, salesCategory, availability, sellerCount, timestamp, snapshotSource

#### Scenario: Price snapshots reference products
- **WHEN** a price snapshot is created
- **THEN** the productId SHALL reference a valid product in the products table

### Requirement: Define alerts table schema
The system SHALL provide an alerts table that stores monitoring alerts and notifications.

#### Scenario: Alerts table exists
- **WHEN** the database is initialized
- **THEN** an alerts table SHALL exist with fields: id, ruleId, productId, alertType, severity, title, message, dataSnapshot, isRead, isArchived, notifiedAt, createdAt

#### Scenario: Alerts reference products
- **WHEN** an alert is created
- **THEN** the productId SHALL reference a valid product in the products table

### Requirement: Support database migrations
The system SHALL provide a migration mechanism to evolve the database schema over time.

#### Scenario: Migrations are versioned
- **WHEN** schema changes are made
- **THEN** migration files SHALL be generated with version numbers

#### Scenario: Migrations can be applied
- **WHEN** running the migration command
- **THEN** all pending migrations SHALL be applied in order
