# Component Library

## Purpose

This capability provides a comprehensive, reusable component library that establishes consistent visual language and interaction patterns across the entire application. The library includes foundational UI components (buttons, inputs, badges), data visualization components (KPI cards, charts, tables), and layout components (cards) with built-in accessibility support.

## Requirements

### Requirement: Button component variants
The system SHALL provide Primary, Secondary, and Ghost button variants with consistent styling and interaction states.

#### Scenario: Primary button styling
- **WHEN** rendering a Primary button
- **THEN** system applies Primary-600 background, white text, 44px height, 12px border radius
- **WHEN** user hovers over Primary button
- **THEN** system changes background to Primary-700

#### Scenario: Secondary button styling
- **WHEN** rendering a Secondary button
- **THEN** system applies white background, gray border, gray text, 44px height, 12px border radius

#### Scenario: Ghost button styling
- **WHEN** rendering a Ghost button
- **THEN** system applies transparent background
- **WHEN** user hovers over Ghost button
- **THEN** system changes background to Gray-100

### Requirement: Input component with validation states
The system SHALL provide input fields with focus, error, and disabled states.

#### Scenario: Input field styling
- **WHEN** rendering an input field
- **THEN** system applies 44px height, 10px border radius, Gray-200 border

#### Scenario: Input focus state
- **WHEN** user focuses on input field
- **THEN** system applies 2px Primary-200 outline

#### Scenario: Input error state
- **WHEN** input has validation error
- **THEN** system applies error red border and displays error message below field

### Requirement: Badge component with semantic variants
The system SHALL provide badge components with Success, Warning, Error, Info, and Neutral variants.

#### Scenario: Badge styling
- **WHEN** rendering any badge
- **THEN** system applies 24px height, 999px border radius (pill shape), 0-10px horizontal padding

#### Scenario: Semantic badge colors
- **WHEN** rendering Success badge
- **THEN** system uses success green background with appropriate text color
- **WHEN** rendering Warning badge
- **THEN** system uses warning orange background
- **WHEN** rendering Error badge
- **THEN** system uses error red background
- **WHEN** rendering Info badge
- **THEN** system uses info blue background

### Requirement: KPI card component
The system SHALL provide KPI card components displaying metric name, value, and trend indicator.

#### Scenario: KPI card structure
- **WHEN** rendering a KPI card
- **THEN** system displays metric name at top, large value in center, trend indicator with percentage at bottom

#### Scenario: KPI card styling
- **WHEN** rendering KPI card
- **THEN** system applies 120px height, 24px padding, 20px border radius

#### Scenario: Trend visualization
- **WHEN** metric shows positive trend
- **THEN** system displays green upward arrow with percentage
- **WHEN** metric shows negative trend
- **THEN** system displays red downward arrow with percentage

### Requirement: Data table component
The system SHALL provide data table with sorting, row hover, row selection, and action menus.

#### Scenario: Table structure and spacing
- **WHEN** rendering data table
- **THEN** system applies 64px row height, 48px header height, 16px cell padding

#### Scenario: Table hover state
- **WHEN** user hovers over table row
- **THEN** system applies Gray-50 background to row
- **THEN** system reveals row action buttons (Edit, More, Quick View)

#### Scenario: Table selection state
- **WHEN** user selects table row
- **THEN** system applies Primary-50 background to row

#### Scenario: Column sorting
- **WHEN** user clicks sortable column header
- **THEN** system sorts table data by that column
- **THEN** system displays sort indicator (up/down arrow) in header

### Requirement: Chart components
The system SHALL provide line chart and donut chart components with minimal, rounded styling.

#### Scenario: Line chart styling
- **WHEN** rendering line chart
- **THEN** system uses 3px stroke width, rounded line caps
- **THEN** system displays dashed grid lines with 20% opacity

#### Scenario: Donut chart styling
- **WHEN** rendering donut chart
- **THEN** system uses 14-18px thickness for ring
- **THEN** system displays key metric in center of donut

#### Scenario: Chart container
- **WHEN** rendering any chart
- **THEN** system applies 20px border radius to chart container

### Requirement: Card component
The system SHALL provide card container with optional title, description, content area, and action slot.

#### Scenario: Card structure
- **WHEN** rendering card
- **THEN** system displays optional title at top, optional description below title, content area, and optional action area at bottom

#### Scenario: Card styling
- **WHEN** rendering card
- **THEN** system applies 24px padding, 20px border radius, 1px solid Gray-100 border, Elevation 1 shadow

### Requirement: Component accessibility
The system SHALL ensure all components meet WCAG AA contrast requirements and support keyboard navigation.

#### Scenario: Keyboard navigation
- **WHEN** user navigates using keyboard
- **THEN** system shows visible focus indicators on all interactive elements
- **THEN** system supports Tab/Shift+Tab for focus movement

#### Scenario: Screen reader support
- **WHEN** screen reader user interacts with components
- **THEN** system provides appropriate ARIA labels and roles for all interactive elements

#### Scenario: Click target size
- **WHEN** rendering interactive elements
- **THEN** system ensures minimum 44px touch target size for buttons and clickable elements

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
