## Why

The backend foundation now has protected local-only auth, PostgreSQL, session
capture APIs, and AI review APIs, but operators still cannot complete a real
browser workflow. The next useful V0 is to let an internal operator enter a
team-scoped workspace, create or edit a live-session capture, save it, and submit
it for review readiness from `/sessions`.

This is the fastest path from "implemented infrastructure" to an internally
usable badminton live-commerce operations tool. It reduces the current friction
of relying on static preview cards or route-check scripts and gives operators a
visible workflow they can try before production auth, RAG, external platforms, or
advanced AI UI are introduced.

### Pre-Proposal Research And Value Notes

- Next.js official App Router authentication guidance was checked for keeping
  auth/session logic on the server and avoiding provider details in UI code:
  `https://nextjs.org/docs/app/guides/authentication`.
- Next.js Route Handler guidance was checked for using server Route Handlers as
  the browser-facing BFF boundary: `https://nextjs.org/docs/app/api-reference/file-conventions/route`.
- OWASP CSRF Prevention Cheat Sheet and Session Management Cheat Sheet were
  checked for keeping mutation CSRF headers, HttpOnly session cookies, SameSite
  cookie behavior, and server-side authorization in the design:
  `https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html`
  and
  `https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html`.
- W3C/WAI form validation and WCAG status/error guidance were checked for
  accessible validation, actionable errors, and non-color-only feedback:
  `https://www.w3.org/WAI/tutorials/forms/validation/`,
  `https://www.w3.org/WAI/WCAG22/Understanding/error-identification.html`, and
  `https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html`.
- NN/g usability heuristics were checked for visibility of system status, error
  prevention, and recovery-oriented UI feedback:
  `https://www.nngroup.com/articles/ten-usability-heuristics/`.
- Skill-backed exploration used OpenSpec exploration, roadmap planning,
  prioritization, opportunity-solution tree, JTBD, ui-ux-pro-max, frontend
  design, codebase recon, and TDD/verification skills. The outcome is to
  prioritize the operator session capture workflow over new isolated APIs because
  it is the highest value/effort route to a usable V0.

## What Changes

- Add a local-only operator V0 entry path that can create or reuse a demo
  operator/team/session cookie for development and internal preview use without
  adding a production login provider, OAuth callback, invite flow, or team
  management UI.
- Convert `/sessions` from a static preview into a browser workflow that can:
  - discover authenticated/team context,
  - show empty/loading/error/saved/disabled states,
  - list existing session captures,
  - create a draft with session facts, host role, product order, notes, customer
    questions, and objections,
  - save draft updates through the existing protected session capture API, and
  - submit complete captures to review-ready state.
- Preserve the existing Route Handler and repository boundaries:
  UI calls HTTP APIs; it does not import repositories, database clients, AI
  providers, or server-only modules.
- Update user-facing copy from "暂不能保存" to concise operator-facing save and
  submit states.
- Add repeatable verification for the V0 browser workflow using local PostgreSQL
  and existing route checks, plus Playwright browser verification before archive.
- Update docs and roadmap notes to reflect that `/sessions` is the first
  browser-usable V0 workflow.

Non-goals:

- No production authentication provider, middleware-wide protection, invitation,
  tenant/team management UI, payment, analytics, queue, object storage, RAG, Q&A,
  public source discovery, Douyin/e-commerce integration, transcript upload, or
  real AI generation call.
- No direct DeepSeek call from this workflow.
- No change to the existing session capture repository ownership model or
  tenant/team authorization rules.

## Capabilities

### New Capabilities
- `operator-v0-session-workflow`: Defines the local-only operator bootstrap and
  browser session capture workflow that turns existing protected APIs into an
  internally usable V0 experience.

### Modified Capabilities
- `auth-route-runtime`: Adds a local-only V0 operator bootstrap route that issues
  an app-owned HttpOnly session cookie for a seeded internal operator context
  without becoming a production login provider.
- `session-capture-workbench`: Changes `/sessions` from a frontend-only static
  workbench into a browser workflow that uses existing protected session capture
  APIs for list/create/draft-save/submit.

## Impact

- Affected routes/components:
  - `apps/web/src/app/sessions/page.tsx`
  - `apps/web/src/components/session-capture-workbench.tsx`
  - new or updated client-side session workflow helpers/components under
    `apps/web/src/components` or `apps/web/src/lib`
  - new local-only auth bootstrap Route Handler under `apps/web/src/app/api/auth`
    if needed by the design
- Affected server code:
  - auth route/bootstrap helper using existing auth session, cookie, and database
    primitives
  - optional V0 verifier script that proves bootstrap plus session workflow API
    behavior
- Affected docs/specs:
  - OpenSpec delta specs for auth route runtime and session capture workbench
  - roadmap/README updates once implementation changes visible behavior
- Dependencies:
  - No new runtime dependencies planned.
- Verification:
  - `openspec validate implement-operator-v0-session-workflow`
  - local route verifier for the V0 bootstrap/workflow
  - existing auth/session/API checks
  - `pnpm lint`, `pnpm typecheck`, `pnpm build`
  - Playwright desktop/mobile verification for `/sessions` before archive
