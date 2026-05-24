# workspace-theme Specification

## Purpose
Define the global token-based visual theme for the operator workspace, including shadcn-compatible semantic variables, product surface/status tokens, chart colors, and light/dark readability constraints.
## Requirements
### Requirement: Workspace theme is controlled by global tokens
The web application SHALL define its visual theme through global CSS variables
compatible with shadcn semantic colors and Tailwind theme tokens.

#### Scenario: Components use semantic theme variables
- **WHEN** workspace components render cards, navigation, buttons, badges, borders, focus rings, and sidebars
- **THEN** their colors resolve through global variables such as `--background`, `--foreground`, `--card`, `--primary`, `--muted`, `--border`, `--ring`, and `--sidebar-*`

#### Scenario: Product-specific tokens are available
- **WHEN** future workspace surfaces need neutral surfaces, status colors, or chart colors
- **THEN** `globals.css` exposes reusable tokens for surface, success, warning, info, and chart colors without requiring component-level hardcoded palette values

### Requirement: Theme supports modern operational dashboard readability
The global theme SHALL be modern, calm, data-dense, and suitable for repeated
Chinese operator workflows.

#### Scenario: Light theme supports dense dashboard scanning
- **WHEN** the workspace renders in the default theme
- **THEN** backgrounds, cards, sidebars, muted text, and borders provide clear separation without low-contrast text or single-hue visual monotony

#### Scenario: Dark theme remains token-compatible
- **WHEN** `.dark` is applied to the document
- **THEN** the same semantic variables provide a coherent dark palette without requiring component-specific dark color overrides

### Requirement: Theme changes do not add new dependencies
The theme implementation SHALL rely on CSS variables, Tailwind v4 theme tokens,
and existing shadcn-compatible primitives.

#### Scenario: Theme is implemented
- **WHEN** the theme token baseline is added
- **THEN** no new npm dependency, font package, theme package, or runtime style library is introduced

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

### Requirement: Workspace layout density is globally governed
The workspace theme and shell SHALL support full-width operational layouts
without page-local maximum-width wrappers around the entire application.

#### Scenario: Shell layout is changed
- **WHEN** the workspace shell defines desktop width behavior
- **THEN** width constraints are applied intentionally to content sections or
  text blocks, not to the whole application shell

