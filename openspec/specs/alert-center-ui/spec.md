# Alert Center UI Specification

## Purpose

This capability provides a centralized interface for viewing, filtering, and managing system alerts with bulk operations support.

---

## Requirements

### Requirement: Display alerts list
The system SHALL display all alerts in a vertical list with full details.

#### Scenario: Show alert card with title and severity
- **WHEN** viewing alerts center
- **THEN** system SHALL display each alert as a card showing title, severity badge, message, and creation timestamp

#### Scenario: Display severity badge with color
- **WHEN** viewing alert card
- **THEN** system SHALL show severity badge with color: red for critical, default for warning, secondary for info

#### Scenario: Sort alerts by creation date descending
- **WHEN** loading alerts from API
- **THEN** system SHALL display most recent alerts first (ordered by createdAt DESC)

#### Scenario: Dim read alerts visually
- **WHEN** alert is marked as read (isRead=true)
- **THEN** system SHALL reduce opacity to 60% to distinguish from unread alerts

### Requirement: Filter alerts by criteria
The system SHALL allow users to filter alerts by read status and severity.

#### Scenario: Filter by all alerts
- **WHEN** user selects "All" filter
- **THEN** system SHALL display all alerts regardless of read status or severity

#### Scenario: Filter by unread alerts
- **WHEN** user selects "Unread" filter
- **THEN** system SHALL display only alerts with isRead=false

#### Scenario: Filter by critical severity
- **WHEN** user selects "Critical" filter
- **THEN** system SHALL display only alerts with severity="critical"

#### Scenario: Show unread count in page header
- **WHEN** viewing alerts center
- **THEN** system SHALL display count of unread alerts in the page subtitle (e.g., "5 unread alerts")

### Requirement: Mark individual alert as read
The system SHALL allow users to mark alerts as read individually.

#### Scenario: Show mark as read button on unread alerts
- **WHEN** viewing unread alert card (isRead=false)
- **THEN** system SHALL display "Mark as Read" button with checkmark icon

#### Scenario: Hide mark as read button on read alerts
- **WHEN** viewing read alert card (isRead=true)
- **THEN** system SHALL not display the "Mark as Read" button

#### Scenario: Update alert to read on button click
- **WHEN** user clicks "Mark as Read" button
- **THEN** system SHALL call PATCH /api/alerts/:id with isRead=true and update UI immediately

### Requirement: Mark all alerts as read
The system SHALL allow users to mark all filtered alerts as read in bulk.

#### Scenario: Show mark all button when unread alerts exist
- **WHEN** there are unread alerts in current filter
- **THEN** system SHALL display "Mark All as Read" button in page header

#### Scenario: Hide mark all button when no unread alerts
- **WHEN** all alerts in current view are read
- **THEN** system SHALL not display "Mark All as Read" button

#### Scenario: Mark all unread alerts as read
- **WHEN** user clicks "Mark All as Read" button
- **THEN** system SHALL call PATCH /api/alerts/:id for each unread alert sequentially and update UI after all complete

### Requirement: Delete alert
The system SHALL allow users to remove alerts permanently.

#### Scenario: Confirm before deletion
- **WHEN** user clicks delete button on alert card
- **THEN** system SHALL show browser confirmation dialog asking "Are you sure you want to delete this alert?"

#### Scenario: Delete alert on confirmation
- **WHEN** user confirms deletion
- **THEN** system SHALL call DELETE /api/alerts/:id and remove alert from list

#### Scenario: Cancel deletion
- **WHEN** user cancels deletion confirmation
- **THEN** system SHALL not delete the alert

### Requirement: Handle empty states
The system SHALL display appropriate messages when no alerts match criteria.

#### Scenario: Show empty state message
- **WHEN** no alerts match current filter
- **THEN** system SHALL display centered message "No alerts to display"
