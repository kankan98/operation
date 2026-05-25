## Context

The project has implemented local-only app-owned auth guard, session, cookie, auth route, operator V0 bootstrap, and unified internal trial access. The six operator workbenches have protected Route Handler consumers and browser workflows, but the visible routes still behave like public pages until each workbench verifies session state client-side. This is acceptable for internal preview but weak for a usable MVP trial because evaluators can open workbench URLs without first understanding the active trial/team context.

This change belongs mainly to technical roadmap stage 2 with a small stage 4 UX surface:

- Stage 2: extend the auth/session/cookie route boundary with protected workspace route decisions, still provider-neutral.
- Stage 4: make existing protected workbenches feel trial-ready from the browser without changing business repositories.

No auth provider, provider SDK, external account, queue, object storage, production deployment provider, RAG, or live AI release is introduced.

## Goals / Non-Goals

**Goals:**

- Add a public trial entry route for controlled MVP evaluation.
- Redirect unauthenticated access to implemented operator workbench routes toward the trial entry.
- Preserve `/` as the overview/cockpit and keep it useful for trial entry and ready state.
- Show a compact trial/team status surface that distinguishes "need trial access" from "ready in demo team".
- Keep actual tenant/team authorization in existing Route Handlers and repositories.
- Add repeatable local verification for route decisions, redirect targets, session cookie presence, logout clearing, no-store behavior, and redaction.
- Update auth contract, roadmap, and specs so future work can separate internal V0 bootstrap, public trial auth foundation, and production provider login.

**Non-Goals:**

- No OAuth, Auth.js, password login, magic link, SSO, provider callback, invite acceptance, team administration, or role editing UI.
- No real customer data, orders, private messages, phone/address data, supplier strategy, or full raw transcript entry through HTTP preview.
- No live DeepSeek release, RAG/Q&A runtime, web discovery, prompt evaluation suite, or AI provider retries.
- No Docker redeploy during unarchived implementation; Docker redeploy remains post-archive.
- No broad rewrite of all six workbench internals unless directly needed for route/session status correctness.

## Decisions

### 1. Use middleware for optimistic route protection, not business authorization

Implemented workbench paths (`/sessions`, `/rackets`, `/knowledge`, `/ai-review`, `/talk-tracks`, `/next-actions`) will be treated as trial-protected routes. Middleware will check for the app-owned session cookie and redirect missing-cookie requests to `/trial?next=<path>`. If a cookie exists, the request may proceed to the page, but workbench data access still requires existing `GET /api/auth/session` and business Route Handler authorization.

Rationale: Next.js supports request-time routing gates, but OWASP/NIST session guidance still requires sensitive access to depend on server-owned session validation. Middleware cannot be the final authorization source because it should not own database-backed membership checks.

Alternatives considered:

- Full provider login now: rejected because provider, HTTPS/domain, invitation, and recovery choices are not settled.
- Page-only client checks: rejected because users can still open workbench URLs and see an ambiguous state before trial entry.
- Middleware DB validation: rejected for this wave because the current session resolver is server/database-bound, and duplicating it in middleware would blur boundaries and increase runtime risk.

### 2. Add `/trial` as a controlled trial entry surface

`/trial` will render a focused operator-facing entry/status page using the existing internal trial helper functions. It will accept a `next` query path constrained to known workspace routes. When trial entry succeeds, the UI directs the evaluator to the requested route or the recommended `/sessions` start.

Rationale: This avoids turning the root overview into a login page while still giving redirected users a clear access step. It also makes MVP evaluation more shareable: a deep link can safely bounce through trial entry.

Alternatives considered:

- Use `/` as the only entry: rejected because middleware redirects need a stable path that is not itself protected.
- Add a generic `/login`: rejected because the system does not yet provide production login and must not imply provider authentication.

### 3. Share route constants across middleware, UI, and checks

Create a small framework-neutral helper for trial route constants: cookie name, protected workspace paths, trial entry path, next-path sanitization, and redirect target creation. Move the session cookie name source into a non-server-only constant and re-export it from the existing server auth module to avoid drift.

Rationale: Route protection has to run in middleware while session resolution stays server-only. A small shared helper keeps the boundary explicit without importing `server-only` modules into middleware.

Alternatives considered:

- Duplicate literals in middleware and checks: rejected because auth cookie and protected path drift would be hard to catch.
- Import `server/auth/session.ts` into middleware: rejected because it is marked `server-only` and owns database/session resolution.

### 4. Keep trial display scope non-secret and verifiable

The browser may continue storing only tenant/team/actor display scope in localStorage. It must not store raw cookies, session references, provider tokens, database URLs, invitation secrets, or API keys. Route protection will only inspect cookie presence, and session verification will continue to call the safe auth session route with explicit tenant/team scope.

Rationale: This keeps session secrets in `HttpOnly` cookies and preserves the existing data handling model.

### 5. Verification proves boundaries, not just happy-path UI

Add a dedicated local check for public trial route decisions. It should prove:

- Known workbench routes redirect to `/trial` when the auth cookie is missing.
- Existing auth cookie allows the request to pass the optimistic route gate.
- `/trial` and `/` are not redirected.
- Unknown/non-workspace routes are not captured by trial middleware.
- Unsafe `next` values fall back to the recommended route.
- Redirect responses are `no-store` and never contain raw cookie/session/provider payloads.

Existing `internal-trial:check`, auth checks, and affected workbench checks will continue to prove the server authorization path.

## Risks / Trade-offs

- **Risk: Cookie presence is mistaken for authorization.** Mitigation: design, specs, and helper names will call it an optimistic route gate; Route Handlers remain authoritative.
- **Risk: Users mistake trial access for production login.** Mitigation: `/trial` uses concise copy such as "试用访问" and "演示团队"; docs/specs carry the stronger non-production warning.
- **Risk: Open redirect through `next`.** Mitigation: only allow known workspace paths beginning with `/` and reject absolute URLs, protocol-relative URLs, API paths, and unknown paths.
- **Risk: Redirect loops.** Mitigation: `/trial`, `/`, API paths, assets, and Next internals are excluded from protected matching.
- **Risk: Middleware changes break public preview.** Mitigation: validate static build and run route-decision checks before browser verification; Docker redeploy waits until archive.

## Migration Plan

1. Add shared trial auth routing constants and route decision helpers.
2. Add middleware that redirects missing-cookie requests for implemented workbench routes to `/trial`.
3. Add the `/trial` page and compact trial status/next-route handling.
4. Extend local auth verification with route-decision coverage.
5. Update auth contract, roadmap, OpenSpec specs, and task status.
6. Run OpenSpec validation and app checks; run Playwright before archive because rendered route/access behavior is in scope.
7. After archive only: commit, push, rebuild/restart Docker preview, and verify public preview health.

Rollback path: remove `apps/web/src/middleware.ts`, remove `/trial`, and keep the existing internal trial cockpit and workbench-level session verification. Business APIs and repository authorization remain unchanged.

## Open Questions

- Production login provider remains a later provider-selection change after MVP trial validation.
- HTTPS/domain, backup/recovery, observability, and real sensitive data policy remain productionization decisions.
- The next development wave should likely choose between real DeepSeek release behind this trial boundary or production provider-login comparison, based on how much MVP evaluation feedback is needed first.
