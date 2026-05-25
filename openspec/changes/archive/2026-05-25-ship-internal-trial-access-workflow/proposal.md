## Why

The current V0 workbenches can save and review data, but each page asks the evaluator to enter the team context separately and the overview does not clearly show whether the internal trial session is ready. This slows internal Alpha evaluation even though the underlying session, cookie, and protected API runtime already exist.

## What Changes

- Add a unified internal V0 trial access surface in the workspace shell and overview.
- Reuse the existing `POST /api/auth/operator-v0-session`, `GET /api/auth/session`, and `POST /api/auth/logout` boundaries instead of adding a production auth provider.
- Centralize browser-side V0 scope/session helpers so workbenches share entry, verification, scoped URL, storage, and logout behavior.
- Show a compact trial status, next recommended workflow, and quick links to the six implemented V0 workbenches.
- Add repeatable verification for bootstrap, scoped session verification, protected racket API access, logout, and safe disabled/error behavior.
- Keep internal HTTP preview explicitly demo-only; do not add OAuth, password login, invitations, provider callbacks, middleware-wide protection, real customer data handling, RAG, or production AI calls in this wave.

## Capabilities

### New Capabilities

- `internal-trial-access-workflow`: Unified browser workflow for entering, verifying, using, and leaving the internal V0 trial team context across the operator workspace.

### Modified Capabilities

- `operator-v0-session-workflow`: Extend the V0 entry workflow from page-local entry actions to a shared workspace-level entry/session/logout experience.
- `v0-internal-trial-preview`: Extend public preview verification to include the unified trial access path and protected API smoke check.
- `workspace-layout-copy`: Add operator-facing trial status and next-step copy without exposing implementation details in normal UI.

## Source Notes

- Next.js official authentication guidance separates optimistic route checks from secure database-backed authorization and recommends centralizing authorization logic; this supports keeping protected business access in existing Route Handlers while adding only a lightweight workspace trial entry.
  Source: https://nextjs.org/docs/app/guides/authentication
- OWASP CSRF guidance recommends CSRF protection for state-changing cookie-authenticated requests and notes custom request headers for API-driven clients; this supports continuing the existing `x-operation-csrf` mutation pattern.
  Source: https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html
- OWASP session guidance emphasizes opaque, high-entropy session identifiers and `Secure` / `HttpOnly` cookie attributes; this supports reusing the app-owned session cookie runtime and keeping HTTP preview as an explicit internal exception.
  Source: https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html
- NIST SP 800-63B session guidance treats browser cookies as short-term session secrets, recommends logout availability, and warns against insecure transport for authenticated sessions; this keeps this wave scoped to internal V0 demo data and not production authentication.
  Source: https://pages.nist.gov/800-63-4/sp800-63b.html

## Skill-Backed Value Exploration

- `openspec-explore`: The next coherent wave is a trial access workflow, not another single business endpoint, because the current blocker is evaluator entry and cross-page continuity.
- `roadmap-planning` / `prioritization-advisor`: For an early internal V0 with limited data, use a Now/Next/Later roadmap plus value/effort filtering. A unified trial entry is high value and moderate effort; production auth provider, RAG, and web discovery remain larger later-stage bets.
- `ui-ux-pro-max`: Design system guidance was adapted toward a calm operational dashboard rather than the suggested vibrant webinar pattern. Stack guidance supports route-level auth thinking, loading states, and responsive operational UI.

## User Value

- Target roles: live operator, product owner, reviewer, and team lead evaluating the V0.
- Workflow improved: starting a trial session, moving between session capture, product source review, knowledge, AI review, talk tracks, and next actions.
- Friction reduced: repeated "enter team" actions, unclear session state, and weak overview guidance.
- Expected result: an evaluator can enter once from the overview or shell, see the current demo team, follow the recommended V0 path, and leave the session without raw cookie or implementation exposure.
- Product highlight: a restrained "trial cockpit" that makes the existing end-to-end loop feel intentional and usable without decorative UI or production-auth overreach.

## Impact

- Affected areas: `apps/web/src/components/workspace-shell.tsx`, `workspace-pages.tsx`, workbench entry helpers, shared V0 workflow utilities, auth/session route checks, docs, roadmap, and OpenSpec specs.
- APIs: Reuse existing auth/session/logout/operator V0 and protected V0 APIs; no new external provider API.
- Dependencies: No new npm dependency.
- Security: Maintains server-side tenant/team authorization, no raw cookie exposure, no committed secrets, and explicit internal-only HTTP preview language.
- Verification: `openspec validate ship-internal-trial-access-workflow`, lint, typecheck, build, auth/operator V0 checks, affected V0 checks, Playwright before archive, and public preview health after archive.
