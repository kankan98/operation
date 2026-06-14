## ADDED Requirements

### Requirement: Test MetricCard component
The system SHALL provide unit tests for the MetricCard component.

#### Scenario: Render metric with value
- **WHEN** MetricCard is rendered with title and value
- **THEN** component SHALL display the title and formatted value

#### Scenario: Render metric with icon
- **WHEN** MetricCard is rendered with an icon
- **THEN** component SHALL display the icon alongside the title

#### Scenario: Render metric with trend
- **WHEN** MetricCard is rendered with trend indicator (up/down)
- **THEN** component SHALL display appropriate trend arrow and color

### Requirement: Test ProductCard component
The system SHALL provide unit tests for the ProductCard component.

#### Scenario: Render product information
- **WHEN** ProductCard is rendered with product data
- **THEN** component SHALL display title, price, platform, and availability

#### Scenario: Handle product image
- **WHEN** ProductCard is rendered with image URL
- **THEN** component SHALL display product image with alt text

#### Scenario: Handle missing image
- **WHEN** ProductCard is rendered without image URL
- **THEN** component SHALL display placeholder image

#### Scenario: Render action buttons
- **WHEN** ProductCard is rendered
- **THEN** component SHALL display Edit and Delete buttons

#### Scenario: Handle button clicks
- **WHEN** user clicks Edit or Delete button
- **THEN** component SHALL call respective callback functions

### Requirement: Test ProductForm component
The system SHALL provide unit tests for the ProductForm component.

#### Scenario: Render form fields
- **WHEN** ProductForm is rendered in create mode
- **THEN** component SHALL display all required fields (platform, URL, ASIN, title, etc.)

#### Scenario: Validate required fields
- **WHEN** user submits form with missing required fields
- **THEN** component SHALL display validation error messages

#### Scenario: Validate URL format
- **WHEN** user enters invalid URL
- **THEN** component SHALL display URL format error message

#### Scenario: Handle form submission
- **WHEN** user submits valid form data
- **THEN** component SHALL call onSubmit callback with form values

#### Scenario: Populate form in edit mode
- **WHEN** ProductForm is rendered in edit mode with existing product
- **THEN** component SHALL pre-fill all fields with product data

### Requirement: Test AlertItem component
The system SHALL provide unit tests for the AlertItem component.

#### Scenario: Render alert information
- **WHEN** AlertItem is rendered with alert data
- **THEN** component SHALL display title, message, severity badge, and timestamp

#### Scenario: Display severity colors
- **WHEN** AlertItem is rendered with different severities
- **THEN** component SHALL use appropriate colors (red for critical, yellow for warning, blue for info)

#### Scenario: Render action buttons
- **WHEN** AlertItem is rendered for unread alert
- **THEN** component SHALL display "Mark as Read" button

#### Scenario: Handle mark as read
- **WHEN** user clicks "Mark as Read" button
- **THEN** component SHALL call onMarkAsRead callback

#### Scenario: Handle delete action
- **WHEN** user clicks Delete button
- **THEN** component SHALL call onDelete callback

### Requirement: Test Dashboard page
The system SHALL provide integration tests for the Dashboard page.

#### Scenario: Render loading state
- **WHEN** Dashboard is mounted and data is loading
- **THEN** page SHALL display loading indicators

#### Scenario: Render metrics cards
- **WHEN** Dashboard loads with product and alert data
- **THEN** page SHALL display metric cards with correct counts

#### Scenario: Render recent alerts list
- **WHEN** Dashboard loads with alert data
- **THEN** page SHALL display the 5 most recent alerts

#### Scenario: Handle API errors
- **WHEN** API request fails
- **THEN** page SHALL display error message with retry option

### Requirement: Test ProductsList page
The system SHALL provide integration tests for the ProductsList page.

#### Scenario: Render product grid
- **WHEN** ProductsList loads with products
- **THEN** page SHALL display products in grid layout

#### Scenario: Handle empty state
- **WHEN** ProductsList loads with no products
- **THEN** page SHALL display empty state message with add product prompt

#### Scenario: Open add product dialog
- **WHEN** user clicks "Add Product" button
- **THEN** page SHALL display product form dialog

#### Scenario: Create new product
- **WHEN** user submits valid product form
- **THEN** page SHALL call API to create product and refresh list

#### Scenario: Delete product with confirmation
- **WHEN** user clicks delete and confirms
- **THEN** page SHALL call API to delete product and refresh list

### Requirement: Test ProductDetail page
The system SHALL provide integration tests for the ProductDetail page.

#### Scenario: Load product details
- **WHEN** ProductDetail page mounts with product ID
- **THEN** page SHALL fetch and display product information

#### Scenario: Render price chart
- **WHEN** ProductDetail loads with price history
- **THEN** page SHALL display price trend chart with historical data

#### Scenario: Render price statistics
- **WHEN** ProductDetail loads price stats
- **THEN** page SHALL display metric cards for current, highest, lowest, average price, etc.

#### Scenario: Handle check now action
- **WHEN** user clicks "Check Now" button
- **THEN** page SHALL trigger scraper and refresh data

### Requirement: Test AlertsCenter page
The system SHALL provide integration tests for the AlertsCenter page.

#### Scenario: Render alerts list
- **WHEN** AlertsCenter loads with alerts
- **THEN** page SHALL display all alerts in list format

#### Scenario: Filter by severity
- **WHEN** user selects severity filter
- **THEN** page SHALL display only alerts matching selected severity

#### Scenario: Filter by read status
- **WHEN** user clicks "Unread" filter
- **THEN** page SHALL display only unread alerts

#### Scenario: Mark alert as read
- **WHEN** user marks alert as read
- **THEN** page SHALL update alert status and remove from unread count
