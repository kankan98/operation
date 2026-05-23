## 1. Scaffold And Workspace

- [x] 1.1 Confirm local Node.js, pnpm/Corepack, and OpenSpec commands needed for the scaffold
- [x] 1.2 Add root `package.json` and `pnpm-workspace.yaml` with scripts for web dev, lint, type check, and build
- [x] 1.3 Scaffold `apps/web` with Next.js App Router, TypeScript, Tailwind CSS, ESLint, `src` directory, and `@/*` import alias
- [x] 1.4 Inspect generated files and remove scaffold content that conflicts with the product foundation

## 2. UI System Baseline

- [x] 2.1 Initialize shadcn-compatible configuration and install only the minimal primitives needed by the shell
- [x] 2.2 Add lucide icon usage for shell navigation and actions
- [x] 2.3 Configure global styles, typography, theme tokens, and responsive layout defaults for a calm data-dense operations UI
- [x] 2.4 Verify Tailwind/Geist/shadcn generated defaults do not cause font fallback, text overflow, or excessive decorative styling

## 3. Operations Shell

- [x] 3.1 Build the root Chinese operations shell with navigation placeholders for live sessions, racket products, seed knowledge, AI reviews, talk tracks, and next-session tasks
- [x] 3.2 Add clear empty/unavailable placeholder states that do not imply auth, data, AI, or integrations are implemented
- [x] 3.3 Add route-level `loading`, `error`, and `not-found` surfaces with Chinese operator-facing text
- [x] 3.4 Keep Server Components as the default and limit Client Components to surfaces that genuinely need interactivity

## 4. Documentation

- [x] 4.1 Document local install, dev server, lint, type check, build, and browser verification commands
- [x] 4.2 Document the scaffold boundaries and explicitly list deferred capabilities: auth, database, AI, seed ingestion, storage, integrations, analytics, payments, and deployment
- [x] 4.3 Update any repository guidance needed so future agents know the app lives under `apps/web`

## 5. Verification

- [x] 5.1 Run dependency install from the repository root
- [x] 5.2 Run lint, type check, and production build from the repository root
- [x] 5.3 Start the local dev server and verify the root route loads
- [x] 5.4 Use Playwright/browser helper to check one desktop and one mobile viewport for console errors, layout overlap, and text overflow
- [x] 5.5 Mark tasks complete only after the corresponding implementation and verification evidence is observed
