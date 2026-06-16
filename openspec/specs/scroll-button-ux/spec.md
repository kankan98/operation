# Scroll Button UX

## Purpose

This specification defines the user experience requirements for the scroll-to-bottom button in the chat interface, including positioning, visual indicators, and interaction behavior.

## Requirements

### Requirement: Center-aligned scroll button positioning
The scroll-to-bottom button SHALL be positioned at the horizontal center of the chat viewport, not right-aligned.

#### Scenario: Button renders at center
- **WHEN** scroll-to-bottom button is visible
- **THEN** button SHALL be horizontally centered in the viewport using CSS centering techniques

#### Scenario: Button position on different screen sizes
- **WHEN** viewport width changes (mobile, tablet, desktop)
- **THEN** button SHALL remain centered relative to the content area

### Requirement: Enhanced new message badge indicator
The scroll button SHALL display a visual indicator (badge) when new messages arrive while user is scrolled up.

#### Scenario: New message arrives while scrolled up
- **WHEN** new message content arrives and user is more than 200px from bottom
- **THEN** scroll button SHALL show a pulsing badge indicator

#### Scenario: Badge clears on scroll to bottom
- **WHEN** user scrolls within 120px of the bottom or clicks scroll button
- **THEN** badge indicator SHALL fade out and be removed

#### Scenario: Badge visibility timing
- **WHEN** user is near bottom (within 120px) and new message arrives
- **THEN** badge SHALL NOT appear (user can already see new content)

### Requirement: Design system compliance
The scroll button SHALL follow the design system specifications from docs/style.md.

#### Scenario: Color scheme alignment
- **WHEN** scroll button is rendered
- **THEN** button SHALL use Agent Purple theme colors (Primary-600 for accent elements)

#### Scenario: Border radius compliance
- **WHEN** scroll button is styled
- **THEN** button SHALL use 12px border radius per button specifications

#### Scenario: Animation timing
- **WHEN** scroll button appears, disappears, or badge animates
- **THEN** animations SHALL use 150-250ms duration with ease-out easing

#### Scenario: Touch target size on mobile
- **WHEN** scroll button is rendered on mobile devices
- **THEN** button SHALL be at least 48px × 48px to meet accessibility requirements (≥44px)

### Requirement: Scroll button visibility logic
The scroll button SHALL appear when user scrolls away from the bottom and disappear when near the bottom.

#### Scenario: Button appears on scroll up
- **WHEN** user scrolls more than 200px away from bottom
- **THEN** scroll button SHALL fade in with slide-up animation

#### Scenario: Button disappears near bottom
- **WHEN** user scrolls within 120px of bottom
- **THEN** scroll button SHALL fade out with smooth transition

#### Scenario: Initial state on page load
- **WHEN** chat page loads with existing messages
- **THEN** scroll button SHALL be hidden (user starts at bottom by default)
