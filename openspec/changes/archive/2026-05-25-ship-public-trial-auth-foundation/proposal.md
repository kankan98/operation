## Why

The current V0 operator workbenches can be evaluated through an internal demo session, but the product is not yet ready for a realistic MVP trial because protected workspace routes are still browseable as generic pages and the trial entry is explicitly internal-only. This wave removes the next major blocker to a usable MVP by introducing a public-trial auth foundation over the existing app-owned session, cookie, tenant/team, and authorization runtime without committing to a production auth provider too early.

## What Changes

- Add a dedicated public trial entry route that starts from the existing app-owned session and deterministic V0 team context but presents it as a controlled trial workflow, not a production login provider.
- Add route-level protection for implemented workspace routes so unauthenticated visitors are directed to the trial entry before reaching operator workbenches.
- Add a compact team context switcher/status surface for trial sessions so evaluators can verify the active actor, tenant, and team before using protected workflows.
- Centralize protected-route decisions in a middleware/proxy-compatible boundary while keeping authoritative tenant/team permission checks in existing server Route Handlers and repositories.
- Extend repeatable auth verification to cover protected workspace route decisions, trial entry redirect behavior, safe session view, logout invalidation, no-store responses, and redaction.
- Update the auth contract, roadmap, and specs so future agents can distinguish internal V0 preview, public trial auth foundation, and later production provider login.
- Keep provider login, OAuth/Auth.js, magic links, invitations, team administration, HTTPS production rollout, real sensitive customer/order data, RAG, and live AI provider release out of scope for this wave.

## Capabilities

### New Capabilities

- `public-trial-auth-foundation`: Controlled public-trial access workflow covering trial entry, protected workspace routing, team context display, logout, safe failures, and verification over the existing app-owned auth runtime.

### Modified Capabilities

- `auth-team-tenant-contract`: Record the new public-trial auth foundation runtime surface, route protection boundary, remaining provider-login exclusions, and verification expectations.
- `internal-trial-access-workflow`: Clarify that existing internal V0 access remains an internal/demo bootstrap path and is superseded by the public trial entry for MVP-facing evaluation.
- `workspace-routing`: Require implemented operator workbench routes to respect the public-trial protected-route boundary instead of behaving as fully public pages.

## Source Notes

- Next.js official authentication guidance distinguishes authentication, session management, and authorization, and its App Router guidance supports using request-time route protection while keeping secure authorization in server/data boundaries. This supports adding route-level trial protection without moving business authorization into UI components.
  Source: https://nextjs.org/docs/app/guides/authentication
- OWASP Session Management guidance emphasizes opaque session identifiers and secure cookie handling. This supports continuing the app-owned `HttpOnly` cookie/session ledger and storing only non-secret trial display scope in the browser.
  Source: https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html
- NIST SP 800-63B treats authenticated sessions as sensitive browser state and requires careful session lifecycle handling. This supports keeping logout, expiry, session invalidation, and non-production HTTP preview warnings explicit.
  Source: https://pages.nist.gov/800-63-4/sp800-63b.html
- Docker official restart policy guidance confirms that preview recovery depends on both container restart policy and Docker daemon startup. This wave will not redeploy Docker until archive, but it preserves the existing `--restart unless-stopped` preview contract.
  Source: https://docs.docker.com/engine/containers/start-containers-automatically/
- DeepSeek official docs confirm the configured API base URL pattern and model list are external provider concerns. This wave deliberately avoids live provider release until the trial auth boundary is ready to protect AI review usage.
  Source: https://api-docs.deepseek.com/zh-cn/

## Skill-Backed Value Exploration

- `openspec-explore`: The next coherent wave is a trial-auth foundation, not another business endpoint, because the core workflows already exist and the current blocker is safe, believable access for MVP evaluation.
- `roadmap-planning` / `prioritization-advisor`: For an early MVP with limited real usage data, a Now/Next/Later roadmap plus value/effort filtering is more appropriate than heavyweight scoring. Public trial access is high leverage because it unlocks realistic use of all implemented workbenches.
- `ui-ux-pro-max`: Design guidance was adapted away from a marketing-heavy enterprise gateway. The useful part is a calm operational entry/status pattern: clear access state, focused primary action, visible team context, responsive layout, and no implementation narration in product UI.
- `superpowers:brainstorming`: The full production-auth idea was decomposed into a smaller coherent wave: controlled trial entry, protected routing, team context status, and verification. Provider login and invitations remain later waves.

## User Value

- Target roles: live operator, product owner, reviewer, team lead, and evaluator trying the V0 end-to-end.
- Workflow improved: entering the workspace, confirming the active team, moving through session capture, product/knowledge review, AI review, talk tracks, and next actions without accidentally treating public pages as production-authenticated.
- Friction reduced: unclear access state, browseable workbench pages without session readiness, repeated mental checks about which demo team is active, and lack of a route-level guard before protected workflows.
- Expected result: an evaluator can enter a controlled trial, see the current team/actor context, open implemented workbenches only through the protected trial boundary, and leave safely.
- Product highlight: a restrained "trial-ready workspace" that makes the MVP feel intentionally usable and safer without adding decorative UI or prematurely committing to a provider.

## Impact

- Affected areas: `apps/web/src/middleware.ts`, trial/login route or workspace entry components, `apps/web/src/components/internal-trial-access.tsx`, `apps/web/src/lib/internal-trial-access.ts`, auth route helpers/checks, workspace route docs, auth contract, roadmap, and OpenSpec specs.
- APIs: Reuse existing `POST /api/auth/operator-v0-session`, `GET /api/auth/session`, `POST /api/auth/logout`, and protected V0 business APIs. No provider callback API is introduced.
- Dependencies: No new runtime dependency.
- Security: Maintains server-side tenant/team authorization, keeps session secrets in `HttpOnly` cookies, avoids storing provider tokens or session references in browser storage, and keeps HTTP preview demo-only.
- Verification: `openspec validate ship-public-trial-auth-foundation`, lint, typecheck, build, auth/session/cookie/route/trial checks, protected-route check, affected V0 checks, Playwright before archive, and Docker public preview verification only after archive.
