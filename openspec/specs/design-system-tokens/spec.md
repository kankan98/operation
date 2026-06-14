# Design System Tokens

## Purpose

This capability defines the foundational design system tokens that ensure visual consistency, scalability, and maintainability across the entire application. It includes comprehensive specifications for colors, typography, spacing, border radius, shadows, and token accessibility.

## Requirements

### Requirement: Color system implementation
The system SHALL implement a comprehensive color palette including primary brand colors (Agent Purple scale), neutral grays, and semantic colors (success, warning, error, info).

#### Scenario: Primary color usage
- **WHEN** rendering interactive elements like buttons, active navigation, or focus states
- **THEN** system uses Primary-600 (#8B5CF6) as the default brand color

#### Scenario: Neutral palette distribution
- **WHEN** rendering the interface
- **THEN** system maintains 85% neutral colors, 10% primary colors, and 5% semantic colors

#### Scenario: Semantic color application
- **WHEN** displaying success states (profit increase, connected integrations)
- **THEN** system uses success green (#22C55E)
- **WHEN** displaying warnings (inventory shortage, ROAS decline)
- **THEN** system uses warning orange (#F59E0B)
- **WHEN** displaying errors (critical alerts, failed syncs)
- **THEN** system uses error red (#EF4444)
- **WHEN** displaying informational content (AI insights, recommendations)
- **THEN** system uses info blue (#3B82F6)

### Requirement: Typography system
The system SHALL use Inter for English text and PingFang SC for Chinese text with defined font scales, weights, and line heights.

#### Scenario: Font family selection
- **WHEN** rendering English text
- **THEN** system uses Inter font with fallbacks (SF Pro Display, Segoe UI, Roboto, sans-serif)
- **WHEN** rendering Chinese text
- **THEN** system uses PingFang SC with fallbacks (HarmonyOS Sans, Microsoft YaHei, sans-serif)

#### Scenario: Typography scale application
- **WHEN** rendering page titles
- **THEN** system uses 28px font size with 700 weight
- **WHEN** rendering body text
- **THEN** system uses 14px font size with 400 weight and 150% line height
- **WHEN** rendering long-form content
- **THEN** system uses 160% line height for improved readability

### Requirement: Spacing system
The system SHALL implement an 8pt grid spacing system with values that are multiples of 4 (4, 8, 12, 16, 24, 32, 40, 48, 64, 80, 96).

#### Scenario: Component spacing
- **WHEN** applying spacing between elements
- **THEN** system uses only multiples of 4 pixels
- **WHEN** choosing between spacing options
- **THEN** system prefers 16px, 24px, or 32px as primary spacing values

### Requirement: Border radius system
The system SHALL apply consistent border radius values across components to create soft geometry.

#### Scenario: Component radius application
- **WHEN** rendering input fields
- **THEN** system applies 10px border radius
- **WHEN** rendering buttons
- **THEN** system applies 12px border radius
- **WHEN** rendering cards
- **THEN** system applies 20px border radius
- **WHEN** rendering modals
- **THEN** system applies 24px border radius
- **WHEN** rendering badges
- **THEN** system applies 999px border radius (pill shape)

### Requirement: Shadow elevation system
The system SHALL implement three elevation levels using subtle shadows that avoid harsh contrast.

#### Scenario: Shadow application by component type
- **WHEN** rendering standard cards
- **THEN** system applies Elevation 1 shadow (0 1px 2px rgba(16,24,40,.05))
- **WHEN** showing hover states
- **THEN** system applies Elevation 2 shadow (0 4px 12px rgba(16,24,40,.08))
- **WHEN** displaying modals or overlays
- **THEN** system applies Elevation 3 shadow (0 20px 40px rgba(16,24,40,.12))

### Requirement: Design token accessibility
The system SHALL expose design tokens as CSS custom properties or design token variables for consistent theming.

#### Scenario: Token consumption
- **WHEN** developers style components
- **THEN** system provides accessible design tokens (e.g., --color-primary-600, --spacing-4, --radius-card)
- **WHEN** switching between light and dark modes
- **THEN** system updates token values while maintaining visual hierarchy
