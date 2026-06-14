# App Layout Specification

## Purpose

This capability provides the overall application structure including navigation, routing, and consistent visual styling across all pages.

---

## ADDED Requirements

### Requirement: Provide sidebar navigation
The system SHALL display a persistent sidebar with navigation links.

#### Scenario: Show application branding
- **WHEN** viewing any page
- **THEN** system SHALL display "E-commerce Monitor" as the application title in the sidebar header

#### Scenario: Display navigation items
- **WHEN** viewing sidebar
- **THEN** system SHALL show navigation items: Dashboard, Products, Alerts, Settings with corresponding icons

#### Scenario: Highlight active route
- **WHEN** user is on a specific page
- **THEN** system SHALL highlight the corresponding navigation item with primary background color

#### Scenario: Navigate on link click
- **WHEN** user clicks a navigation item
- **THEN** system SHALL navigate to the corresponding route without page reload

### Requirement: Support client-side routing
The system SHALL provide URL-based navigation between pages.

#### Scenario: Route to dashboard page
- **WHEN** user navigates to "/"
- **THEN** system SHALL render Dashboard component

#### Scenario: Route to products list page
- **WHEN** user navigates to "/products"
- **THEN** system SHALL render ProductsList component

#### Scenario: Route to product detail page
- **WHEN** user navigates to "/products/:id"
- **THEN** system SHALL render ProductDetail component with product ID from URL

#### Scenario: Route to alerts center page
- **WHEN** user navigates to "/alerts"
- **THEN** system SHALL render AlertsCenter component

#### Scenario: Route to settings page
- **WHEN** user navigates to "/settings"
- **THEN** system SHALL render Settings component

### Requirement: Apply consistent styling
The system SHALL use consistent design system across all pages.

#### Scenario: Load custom fonts
- **WHEN** application initializes
- **THEN** system SHALL load JetBrains Mono for monospace content and DM Sans for UI text

#### Scenario: Apply color theme
- **WHEN** rendering any component
- **THEN** system SHALL use monochromatic slate color palette with green/red/amber accent colors

#### Scenario: Use CSS variables for colors
- **WHEN** styling components
- **THEN** system SHALL reference CSS custom properties defined in index.css for all colors

### Requirement: Maintain responsive layout
The system SHALL adapt layout to different screen sizes.

#### Scenario: Display sidebar and content on desktop
- **WHEN** viewing on screen width >= 1024px
- **THEN** system SHALL show sidebar (width: 256px) and main content area side by side

#### Scenario: Ensure main content scrolls independently
- **WHEN** content exceeds viewport height
- **THEN** system SHALL allow main content to scroll while sidebar remains fixed

### Requirement: Provide React Query context
The system SHALL wrap application in QueryClientProvider for data fetching.

#### Scenario: Configure query client with defaults
- **WHEN** application initializes
- **THEN** system SHALL create QueryClient with refetchOnWindowFocus=false, retry=1, and staleTime=30000ms

#### Scenario: Make query client available to all components
- **WHEN** any component uses React Query hooks
- **THEN** system SHALL have access to the configured QueryClient instance

### Requirement: Handle browser navigation
The system SHALL support browser back/forward buttons.

#### Scenario: Navigate back to previous page
- **WHEN** user clicks browser back button
- **THEN** system SHALL navigate to previous route in history

#### Scenario: Navigate forward to next page
- **WHEN** user clicks browser forward button after going back
- **THEN** system SHALL navigate to next route in history
