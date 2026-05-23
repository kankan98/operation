# web-application-bootstrap Specification

## Purpose
Define the accepted baseline for the first Next.js operator workspace application under `apps/web`, including the stack, root pnpm workspace scripts, Chinese operations shell, route-state surfaces, architecture boundaries, and repeatable verification expectations.
## Requirements
### Requirement: Web application scaffold uses the selected stack
The project SHALL introduce the first web application under `apps/web` using Next.js App Router, TypeScript, React, Tailwind CSS, shadcn/ui-compatible styling, lucide icons, and the `@/*` import alias.

#### Scenario: Application source is added
- **WHEN** the bootstrap implementation adds application code
- **THEN** route code is placed under `apps/web/src/app` and root-level governance, OpenSpec, and agent files remain outside the app directory

#### Scenario: Framework defaults are generated
- **WHEN** the Next.js scaffold is created
- **THEN** it uses App Router, TypeScript, Tailwind CSS, ESLint, and non-interactive scaffolding settings suitable for automated agent execution

### Requirement: Root pnpm workspace is configured
The project SHALL provide root-level pnpm workspace configuration and scripts for operating the web app.

#### Scenario: Developer installs dependencies
- **WHEN** a developer or agent runs the documented install command from the repository root
- **THEN** dependencies for `apps/web` are installed through pnpm and lockfile changes are captured

#### Scenario: Developer runs checks from root
- **WHEN** a developer or agent runs root scripts for linting, type checking, development, or production build
- **THEN** the scripts delegate to the web app consistently without requiring hidden manual directory changes

### Requirement: First screen is a Chinese operations shell
The web app SHALL render an internal Chinese operations workspace shell as the first screen instead of a public landing page.

#### Scenario: Operator opens the root route
- **WHEN** the root route renders
- **THEN** it shows Chinese navigation and working areas for live sessions, racket products, seed knowledge, AI reviews, talk tracks, and next-session tasks

#### Scenario: Placeholder content is displayed
- **WHEN** a future-wave area is not implemented yet
- **THEN** the UI labels it as an unavailable placeholder or empty state and does not imply that data, auth, AI, or integrations are already working

### Requirement: Bootstrap UI includes baseline route states
The web app SHALL include baseline loading, error, not-found, and empty-state surfaces that match the operational UI direction.

#### Scenario: Route segment is loading
- **WHEN** a route segment is in a loading state
- **THEN** the app shows a stable Chinese loading surface without shifting the surrounding shell layout

#### Scenario: Route segment errors
- **WHEN** a route segment throws a recoverable UI error
- **THEN** the app shows an actionable Chinese error surface without exposing sensitive implementation details

#### Scenario: Route is missing
- **WHEN** a user navigates to an unknown route
- **THEN** the app shows a Chinese not-found surface and a clear way back to the operations shell

### Requirement: Architecture boundaries are prepared but not filled with product logic
The scaffold SHALL prepare directories and conventions for UI, domain, data, AI, and integration boundaries without implementing unavailable business capabilities.

#### Scenario: Future modules are organized
- **WHEN** future code is added for features such as racket products, seed knowledge, sessions, AI analysis, or integrations
- **THEN** the bootstrap structure gives those modules clear places to live without mixing them into route files by default

#### Scenario: Out-of-scope capability is requested in bootstrap
- **WHEN** implementation would require auth, database, AI calls, source ingestion, storage, Douyin integration, analytics, payments, or deployment provider configuration
- **THEN** that work is deferred to a separate OpenSpec change

### Requirement: Bootstrap verification is repeatable
The scaffold SHALL provide repeatable verification commands and browser smoke checks for the baseline app.

#### Scenario: Static verification runs
- **WHEN** implementation is complete
- **THEN** lint, type check, and production build commands pass from the repository root

#### Scenario: Browser verification runs
- **WHEN** a local dev server is started
- **THEN** Playwright or the configured browser helper verifies that the root route loads on desktop and mobile viewports without console errors, text overflow, or incoherent UI overlap

#### Scenario: Verification is documented
- **WHEN** future agents inspect the project
- **THEN** setup and verification commands are documented in the repository or app documentation created by this change
