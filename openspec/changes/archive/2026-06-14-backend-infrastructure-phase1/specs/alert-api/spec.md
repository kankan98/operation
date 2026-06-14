## ADDED Requirements

### Requirement: Create alert
The system SHALL allow creating a new alert for a product.

#### Scenario: Create alert with valid data
- **WHEN** creating an alert with productId, alertType, severity, title, and optional message
- **THEN** system SHALL create the alert with id, set isRead to false, and return alert data

#### Scenario: Include data snapshot
- **WHEN** creating an alert with dataSnapshot field
- **THEN** system SHALL store the snapshot data in JSON format

### Requirement: List alerts
The system SHALL allow retrieving alerts with filtering and pagination.

#### Scenario: List all alerts
- **WHEN** GET request to /api/alerts
- **THEN** system SHALL return 200 status with array of alerts ordered by createdAt descending

#### Scenario: Filter by read status
- **WHEN** GET request to /api/alerts?read=false
- **THEN** system SHALL return only unread alerts

#### Scenario: Filter by severity
- **WHEN** GET request to /api/alerts?severity=critical
- **THEN** system SHALL return only alerts with critical severity

#### Scenario: Filter by product
- **WHEN** GET request to /api/alerts?productId=xxx
- **THEN** system SHALL return only alerts for the specified product

#### Scenario: Paginate results
- **WHEN** GET request to /api/alerts?page=1&limit=20
- **THEN** system SHALL return first 20 alerts with pagination metadata

### Requirement: Get alert by ID
The system SHALL allow retrieving a specific alert by its ID.

#### Scenario: Get existing alert
- **WHEN** GET request to /api/alerts/:id with valid alert id
- **THEN** system SHALL return 200 status with alert data

#### Scenario: Alert not found
- **WHEN** GET request to /api/alerts/:id with non-existent id
- **THEN** system SHALL return 404 status with error code ALERT_NOT_FOUND

### Requirement: Mark alert as read
The system SHALL allow marking an alert as read.

#### Scenario: Mark unread alert as read
- **WHEN** PATCH request to /api/alerts/:id with isRead=true
- **THEN** system SHALL update isRead to true and return updated alert

#### Scenario: Mark non-existent alert
- **WHEN** PATCH request to /api/alerts/:id with non-existent id
- **THEN** system SHALL return 404 status with error code ALERT_NOT_FOUND

### Requirement: Archive alert
The system SHALL allow archiving an alert.

#### Scenario: Archive alert
- **WHEN** PATCH request to /api/alerts/:id with isArchived=true
- **THEN** system SHALL update isArchived to true and return updated alert

### Requirement: Delete alert
The system SHALL allow deleting an alert.

#### Scenario: Delete existing alert
- **WHEN** DELETE request to /api/alerts/:id with valid alert id
- **THEN** system SHALL delete the alert and return 204 status

#### Scenario: Delete non-existent alert
- **WHEN** DELETE request to /api/alerts/:id with non-existent id
- **THEN** system SHALL return 404 status with error code ALERT_NOT_FOUND
