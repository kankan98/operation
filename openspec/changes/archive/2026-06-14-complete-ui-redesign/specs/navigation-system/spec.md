## ADDED Requirements

### Requirement: Sidebar layout and dimensions
The system SHALL provide a collapsible sidebar navigation with defined dimensions and spacing.

#### Scenario: Sidebar width states
- **WHEN** sidebar is expanded
- **THEN** system displays sidebar at 240px width
- **WHEN** sidebar is collapsed
- **THEN** system displays sidebar at 72px width showing only icons

#### Scenario: Sidebar background and separators
- **WHEN** rendering sidebar
- **THEN** system applies white background with soft visual separators between sections

### Requirement: Navigation item styling
The system SHALL style navigation items with icon-first hierarchy and distinct states for inactive, active, and hover.

#### Scenario: Navigation item dimensions
- **WHEN** rendering navigation item
- **THEN** system applies 44px height, 12px-16px padding, 12px gap between icon and label

#### Scenario: Inactive navigation item
- **WHEN** navigation item is not active
- **THEN** system displays text in Gray-600 and icon in Gray-500

#### Scenario: Active navigation item
- **WHEN** navigation item represents current page
- **THEN** system applies Primary-50 background, Primary-600 text color, Primary-600 icon color, rounded corners

#### Scenario: Hover state
- **WHEN** user hovers over inactive navigation item
- **THEN** system applies Gray-100 background

### Requirement: Module organization
The system SHALL organize navigation into primary modules: Dashboard, Products, Alerts, Chat, and Settings.

#### Scenario: Module visibility
- **WHEN** rendering sidebar navigation
- **THEN** system displays navigation items for Dashboard, Products, Alerts, Chat, and Settings modules in order

#### Scenario: Module icons
- **WHEN** rendering each navigation item
- **THEN** system displays appropriate icon before label (dashboard icon, product box icon, alert bell icon, chat bubble icon, settings gear icon)

### Requirement: Sidebar collapse interaction
The system SHALL allow users to toggle between expanded and collapsed sidebar states.

#### Scenario: Collapse trigger
- **WHEN** user clicks collapse/expand button
- **THEN** system toggles sidebar between 240px and 72px width with smooth transition

#### Scenario: Collapsed state behavior
- **WHEN** sidebar is collapsed
- **THEN** system shows only icons without labels
- **WHEN** user hovers over collapsed navigation item
- **THEN** system displays tooltip with full label text

#### Scenario: Collapse state persistence
- **WHEN** user collapses or expands sidebar
- **THEN** system persists the state preference
- **WHEN** user returns to application
- **THEN** system restores the last sidebar state

### Requirement: Responsive behavior
The system SHALL adapt navigation layout for mobile and tablet viewports.

#### Scenario: Mobile navigation
- **WHEN** viewport width is below 768px
- **THEN** system displays hamburger menu icon instead of persistent sidebar
- **WHEN** user taps hamburger menu
- **THEN** system displays full navigation in overlay drawer

#### Scenario: Tablet navigation
- **WHEN** viewport width is between 768px and 1024px
- **THEN** system displays sidebar in collapsed state (72px) by default

### Requirement: User menu integration
The system SHALL provide a user menu section in the sidebar with profile and account actions.

#### Scenario: User menu placement
- **WHEN** rendering sidebar
- **THEN** system displays user menu section at bottom of sidebar with profile avatar, name, and dropdown trigger

#### Scenario: User menu actions
- **WHEN** user clicks user menu
- **THEN** system displays dropdown with account settings, language switcher, dark mode toggle, and sign out options
