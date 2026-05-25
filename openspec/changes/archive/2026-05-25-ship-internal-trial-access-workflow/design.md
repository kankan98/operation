## Context

The project now has database-backed local V0 workflows for sessions, rackets, knowledge, AI review, talk tracks, and next actions. Each workbench can enter the deterministic V0 operator/team context, but the entry pattern is duplicated across pages and the overview/shell still behaves like a static index. That makes internal Alpha evaluation feel fragmented even though the auth session, cookie, logout, and protected API boundaries already exist.

This change belongs to technical roadmap stages 2 and 4:

- Stage 2: reuse app-owned session, cookie/request bridge, `GET /api/auth/session`, `POST /api/auth/logout`, and gated `POST /api/auth/operator-v0-session`.
- Stage 4: make existing protected V0 business workflows easier to use from the browser.

It does not change provider selection. It keeps the current internal V0 HTTP preview policy as an explicitly gated evaluation mode.

## Goals / Non-Goals

**Goals:**

- Provide one workspace-level internal V0 trial access component that can enter, verify, refresh, and leave the demo team context.
- Centralize browser-side V0 helper logic for storage, scoped API URLs, bootstrap, session verification, and logout.
- Add a practical overview trial cockpit with session state, recommended next step, and links to implemented workflows.
- Keep every protected data operation behind existing Route Handlers with explicit tenant/team scope and CSRF where required.
- Add local verification for bootstrap, scoped session verification, protected racket access, logout, disabled bootstrap, and redaction.
- Prepare for Playwright pre-archive checks without redeploying Docker during implementation.

**Non-Goals:**

- No OAuth, Auth.js, password login, magic link, provider callback, invitation, team management, middleware-wide protected routing, or production login.
- No real customer private messages, orders, phone/address data, supplier data, pricing strategy, or full raw transcripts in the HTTP preview.
- No DeepSeek live call, RAG, Q&A runtime, web discovery, queue, object storage, production database provider, backup, or observability provider.
- No new npm dependency.

## Decisions

### 1. Build an internal trial access layer over existing auth routes

Use the existing route boundaries:

- `POST /api/auth/operator-v0-session` with `x-operation-csrf: operator-v0`
- `GET /api/auth/session?tenantId=...&teamId=...`
- `POST /api/auth/logout` with `x-operation-csrf: logout`

Rationale: Next.js guidance supports centralizing secure authorization in the server/data boundary rather than scattering sensitive checks in UI. The current project already has server-side guard, session, cookie, and route runtime; adding a provider would slow the V0 Alpha and require external account decisions.

Alternatives considered:

- Add production provider login now: rejected because provider, HTTPS/domain, invitation, and team management decisions are not settled.
- Add middleware/proxy protection now: rejected for this wave because static V0 pages remain browseable, and protected data already requires server-side session and scope checks.
- Keep page-local enter buttons only: rejected because it repeats logic and makes Alpha evaluation feel fragmented.

### 2. Store only display scope in localStorage, never session secrets

Keep the existing `operation.operatorV0Scope` storage key for tenant/team/actor display metadata and use `HttpOnly` cookies for the session reference.

Rationale: OWASP and NIST guidance support opaque cookie-backed session secrets and warn against exposing session secrets to script-readable storage. The browser helper may store the selected trial scope, but the server-owned session remains in the cookie/runtime ledger.

Alternatives considered:

- Store session state in localStorage: rejected because it would expose bearer material to XSS.
- Avoid localStorage entirely: rejected for V0 because page reloads would lose the selected tenant/team scope while the cookie remains valid.

### 3. Add shared browser helpers before refactoring every workbench

Create a shared client utility for V0 trial access and use it in the new shell/overview component first. Existing workbenches can continue using their current wrappers, then migrate incrementally where the helper reduces duplication without risky churn.

Rationale: This keeps the change focused on the Alpha entry experience while still reducing future duplication. It avoids a broad rewrite of six large workbench components.

Alternatives considered:

- Rewrite all workbenches to the shared helper in one wave: rejected because it increases regression risk and Playwright scope.
- Leave helper duplication untouched: rejected because session entry/logout behavior would continue to drift.

### 4. Make the overview a trial cockpit, not a marketing landing page

The overview should show:

- Whether the evaluator is in the internal V0 team.
- The actor/team display context.
- Clear actions: enter, refresh, leave.
- A recommended path across the six implemented workbenches.
- Short, operator-facing status copy.

Rationale: The project is an operational tool. The first screen should help evaluators start work and understand the next operational step, not explain architecture.

Alternatives considered:

- Create a separate `/trial` route: deferred unless the overview becomes too dense. The current root route is already the workspace entry.
- Add long documentation copy in UI: rejected by frontend copy rules.

### 5. Verification focuses on auth continuity and public-preview safety

Add or extend a local check that proves:

- Disabled bootstrap is safe.
- Bootstrap requires the custom CSRF header.
- Successful bootstrap resolves a scoped session.
- A protected V0 API can be called with the resolved scope.
- Logout invalidates the session and clears cookie state.
- Safe responses avoid raw cookies, session references, database URLs, provider payloads, and protected cross-team data.

Rationale: This is the behavior that proves the trial access workflow is useful and still bounded.

## Risks / Trade-offs

- **Risk: Evaluators mistake internal V0 for production login.** Mitigation: UI copy says "内部试用" / "演示团队" in concise operator language; docs and specs keep the stronger non-production warning.
- **Risk: Scope metadata in localStorage goes stale after logout.** Mitigation: logout helper clears the stored scope and session verification handles missing/invalid cookie with a re-enter action.
- **Risk: Shared helper migration causes regressions across six workbenches.** Mitigation: this wave introduces the helper and uses it for the shell/overview first; broad workbench rewrites are only done where directly needed.
- **Risk: HTTP preview cookie weakens security expectations.** Mitigation: the non-`Secure` cookie path remains behind explicit preview flags and documented as demo-only; default cookie policy stays secure.
- **Risk: Trial cockpit becomes decorative.** Mitigation: use dense cards, status badges, direct links, and action buttons only; no hero marketing layout or ornamental animation.

## Migration Plan

1. Add shared V0 trial client helper and local verification.
2. Add shell/overview trial access UI.
3. Update docs, roadmap, and specs to reflect the unified trial entry.
4. Validate locally with OpenSpec, lint, typecheck, build, auth/operator checks, and affected browser/API checks.
5. Run Playwright before archive.
6. After archive, commit, push, rebuild Docker preview, and verify public static route plus database-backed V0 access.

Rollback path: remove the shared trial UI/helper and keep page-local V0 entry actions; existing Route Handlers and workbench protected APIs remain unchanged.

## Open Questions

- Production login provider remains a separate stage-2 decision after internal V0 Alpha evaluation.
- HTTPS/domain, backups, production database provider, and real sensitive data entry remain stage-9 productionization decisions.
