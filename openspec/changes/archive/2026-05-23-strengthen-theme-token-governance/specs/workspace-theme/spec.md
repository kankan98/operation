## ADDED Requirements

### Requirement: Theme governance supports future style replacement
The web application SHALL define theme governance so future visual style changes
can be made primarily through global tokens and documented utility patterns.

#### Scenario: Contributor changes theme style
- **WHEN** a future contributor needs to adjust brand color, surface contrast, status color, radius, density, focus, or motion feel
- **THEN** the primary change location is `apps/web/src/app/globals.css` and the documented token contract rather than individual page components

#### Scenario: Component uses color or status styling
- **WHEN** a workspace component needs color, status, card, border, text, focus, or icon-surface styling
- **THEN** it uses semantic token-backed classes or shared utility aliases instead of hardcoded palette utilities such as page-local blue, purple, green, orange, gray, or hex color values

#### Scenario: Page-specific layout is needed
- **WHEN** a page needs route-specific grid tracks, responsive columns, or content-specific spacing
- **THEN** the layout may remain local while theme-defining values such as colors, radii, panel anatomy, status surfaces, and interaction effects remain globally controlled

### Requirement: Workbench pages share token-backed anatomy utilities
The web application SHALL provide reusable token-backed utility classes for
common workbench surfaces where repetition would otherwise hardcode style.

#### Scenario: Workbench panel renders
- **WHEN** a workbench page renders a primary panel, card row, or icon status surface
- **THEN** it can use global utility aliases backed by CSS variables for panel radius, border, background, shadow, row background, icon surface size, and status color treatment

#### Scenario: Dark theme is active
- **WHEN** `.dark` is applied to the document
- **THEN** the same global token and utility aliases continue to resolve to dark-compatible colors without component-specific dark overrides
