# Price Chart Visualization Specification

## Purpose

This capability provides an interactive line chart displaying price history trends over time using Recharts library.

---

## ADDED Requirements

### Requirement: Render price trend line chart
The system SHALL display a line chart showing price changes over time.

#### Scenario: Plot price snapshots on timeline
- **WHEN** rendering chart with price snapshots
- **THEN** system SHALL display x-axis with formatted dates and y-axis with formatted prices

#### Scenario: Draw line connecting price points
- **WHEN** rendering chart
- **THEN** system SHALL draw a blue line (#8884d8) connecting all price points in chronological order

#### Scenario: Show data points as dots
- **WHEN** rendering chart
- **THEN** system SHALL display small dots (radius 3px) at each price snapshot location

### Requirement: Format chart axes
The system SHALL format axis labels for readability.

#### Scenario: Format x-axis dates
- **WHEN** displaying date labels on x-axis
- **THEN** system SHALL format dates as "Mon DD, YYYY" (e.g., "Jan 15, 2026")

#### Scenario: Angle x-axis labels for space
- **WHEN** rendering x-axis labels
- **THEN** system SHALL rotate labels -45 degrees to prevent overlap

#### Scenario: Format y-axis prices with currency
- **WHEN** displaying price labels on y-axis
- **THEN** system SHALL format prices using currency symbol and locale formatting (e.g., "$99.99")

### Requirement: Display interactive tooltip
The system SHALL show detailed information on hover.

#### Scenario: Show price on hover
- **WHEN** user hovers over a data point
- **THEN** system SHALL display tooltip showing formatted price and date

#### Scenario: Highlight active data point
- **WHEN** user hovers over a data point
- **THEN** system SHALL enlarge the hovered dot to radius 5px

### Requirement: Support responsive sizing
The system SHALL adapt chart size to container width.

#### Scenario: Fill container width
- **WHEN** chart is rendered in any container
- **THEN** system SHALL use ResponsiveContainer to fill 100% of container width

#### Scenario: Maintain fixed height
- **WHEN** chart is rendered
- **THEN** system SHALL use a fixed height of 300px

### Requirement: Display grid lines
The system SHALL show grid lines for easier value reading.

#### Scenario: Show dashed grid lines
- **WHEN** rendering chart
- **THEN** system SHALL display light gray dashed grid lines (strokeDasharray="3 3")

### Requirement: Order snapshots chronologically
The system SHALL display oldest snapshots on the left and newest on the right.

#### Scenario: Reverse snapshot order for display
- **WHEN** receiving snapshots sorted by timestamp descending from API
- **THEN** system SHALL reverse the array before passing to chart so oldest appears first
