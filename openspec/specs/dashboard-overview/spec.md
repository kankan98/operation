# Dashboard Overview Specification

## Purpose

This capability provides a high-level overview of the e-commerce monitoring system, displaying key metrics and recent alerts to give users immediate situational awareness.

---

## Requirements

### Requirement: Display system metrics
The system SHALL display key metrics summarizing the monitoring system's current state.

#### Scenario: Show total product count
- **WHEN** user views the dashboard
- **THEN** system SHALL display the total number of products in the database

#### Scenario: Show monitoring count
- **WHEN** user views the dashboard
- **THEN** system SHALL display the number of products with monitoring enabled (isMonitoring=true)

#### Scenario: Show unread alerts count
- **WHEN** user views the dashboard
- **THEN** system SHALL display the number of alerts marked as unread (isRead=false)

#### Scenario: Show total alerts count
- **WHEN** user views the dashboard
- **THEN** system SHALL display the total number of alerts ever created

### Requirement: Display recent alerts feed
The system SHALL display a list of the most recent alerts for quick access.

#### Scenario: Show last 5 alerts
- **WHEN** user views the dashboard
- **THEN** system SHALL display the 5 most recent alerts sorted by createdAt descending

#### Scenario: Display alert title and severity
- **WHEN** viewing an alert in the recent feed
- **THEN** system SHALL show the alert title, severity badge, and creation timestamp

#### Scenario: Click alert to navigate to alerts center
- **WHEN** user clicks an alert in the recent feed
- **THEN** system SHALL navigate to the alerts center page

### Requirement: Handle loading and error states
The system SHALL gracefully handle data loading and error conditions.

#### Scenario: Show loading indicator while fetching data
- **WHEN** dashboard data is being loaded from API
- **THEN** system SHALL display a loading indicator

#### Scenario: Show error message on API failure
- **WHEN** API request fails for products or alerts
- **THEN** system SHALL display an error message with retry option

### Requirement: Update metrics on data changes
The system SHALL reflect data changes when user returns to dashboard.

#### Scenario: Refresh metrics when navigating back to dashboard
- **WHEN** user navigates to dashboard from another page
- **THEN** system SHALL refetch latest metrics and alerts

