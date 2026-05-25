## 1. Public Trial Routing Boundary

- [x] 1.1 Add shared public-trial routing constants and helpers for auth cookie name, protected workbench paths, trial entry path, next-path sanitization, and redirect decision creation.
- [x] 1.2 Re-export the shared auth session cookie name from the existing server auth session module without importing `server-only` code into middleware.
- [x] 1.3 Add Next.js middleware for missing-cookie redirects from implemented workbench routes to `/trial?next=<path>` while excluding `/`, `/trial`, API routes, assets, and unknown non-workspace routes.

## 2. Trial Entry UI

- [x] 2.1 Add a `/trial` App Router page that uses the existing trial access component in a focused trial-entry layout.
- [x] 2.2 Extend the trial access component/helper to accept a sanitized continue destination and show a clear operator-facing continue action after readiness is verified.
- [x] 2.3 Keep trial copy concise, Chinese, and explicit that this is trial access to a demo team, not production login.

## 3. Verification Runtime

- [x] 3.1 Add a repeatable public trial auth route-decision check that covers missing-cookie redirects, cookie-present pass-through, public route exclusions, unsafe next fallback, no-store redirect responses, and sensitive metadata redaction.
- [x] 3.2 Add root and web package scripts for the new public trial auth check.
- [x] 3.3 Extend the existing internal trial access check or adjacent auth checks only where needed to prove logout/session boundaries still work after route protection changes.

## 4. Documentation And Specs

- [x] 4.1 Update `docs/contracts/auth-team-tenant.md` with the public trial auth foundation surface, optimistic route-gate boundary, non-goals, and verification commands.
- [x] 4.2 Update roadmap and app documentation to reflect `/trial`, protected workbench routing, remaining production-auth exclusions, and post-archive Docker cadence.
- [x] 4.3 Clean up the accepted internal trial spec purpose if this change modifies that spec during archive.

## 5. Verification And Release Readiness

- [x] 5.1 Run `openspec validate ship-public-trial-auth-foundation`.
- [x] 5.2 Run lint, typecheck, build, auth session/cookie/route checks, internal trial check, public trial auth check, and affected V0 workflow checks.
- [x] 5.3 Run Playwright pre-archive browser verification for `/trial`, protected route redirect, ready state, continue path, desktop/mobile layout, and console errors.
- [x] 5.4 Review git diff hygiene and leave the change ready for archive without Docker redeploy until archive.
