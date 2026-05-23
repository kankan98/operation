## ADDED Requirements

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
