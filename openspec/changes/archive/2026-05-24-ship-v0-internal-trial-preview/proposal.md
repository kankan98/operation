## Why

The public Docker preview renders the V0 workbench, but the full authenticated
browser workflow cannot be exercised from `http://203.195.161.93:3000/`
because the app-owned session cookie is intentionally `Secure` and the preview
currently has no HTTPS/domain provider. This blocks the fastest path to an
internal usable V0, where an operator can enter the workspace, save V0 data,
generate a review, and inspect downstream talk-track/task handoff without a
local development setup.

Reliable-source checks shaped the scope:

- MDN `Set-Cookie` documentation confirms the `Secure` attribute limits cookie
  transmission to HTTPS, with localhost as the practical development exception.
- OWASP Session Management guidance reinforces `Secure`, `HttpOnly`,
  `SameSite`, explicit expiration, server-side invalidation, and avoiding raw
  session values in logs.
- Next.js official cookie guidance keeps cookie mutation in Route Handlers or
  Server Actions, matching the existing auth route boundary.
- Docker restart-policy documentation confirms the current
  `--restart unless-stopped` preview container strategy remains the right
  resilience baseline and does not itself solve HTTPS/session policy.

Skill-backed value exploration:

- OpenSpec exploration: the next blocker is not another isolated product API;
  it is public-preview access to the already implemented V0 workflow.
- Opportunity Solution Tree: the desired outcome is an internal evaluator
  completing a live-commerce operations loop on the public preview. The highest
  leverage opportunity is removing the HTTP preview auth blocker while keeping
  production auth out of scope.
- Prioritization: a value/effort pass ranks explicit V0 preview access above
  RAG, web discovery, and full production login because it immediately unlocks
  feedback on the current workflow without new external accounts.
- AI-shaped readiness: the project should preserve its trusted reality layer
  before adding more AI behavior; this wave should keep AI output reviewable and
  avoid changing provider/model policy.

## What Changes

- Add an explicitly gated internal V0 preview cookie policy that can issue and
  clear non-`Secure` app-owned session cookies only when the V0 bootstrap is
  enabled and a separate preview flag is present.
- Keep `Secure`, `HttpOnly`, `SameSite=Lax`, `Path=/`, and seven-day expiration
  as the default auth cookie runtime for local HTTPS-style checks and future
  production login work.
- Shorten V0 preview sessions so an insecure HTTP preview cookie does not behave
  like a production or long-lived session.
- Update the V0 operator bootstrap route to use the preview cookie policy only
  for the internal trial path, without adding OAuth, password login, middleware,
  team management, invitation, or provider tokens.
- Extend local verification to prove default secure cookies still exist,
  preview cookies are only available under explicit flags, preview cookies can
  authenticate V0 scoped requests, logout clears the matching preview cookie,
  and sensitive data is not exposed.
- Update docs and roadmap language so future development distinguishes internal
  HTTP V0 preview access from real HTTPS production authentication.

## Capabilities

### New Capabilities

- `v0-internal-trial-preview`: Internal public-preview access policy and
  verification for the existing V0 operator workflow.

### Modified Capabilities

- `auth-cookie-runtime`: Add an explicit V0 preview cookie policy while
  preserving secure-by-default cookie requirements.
- `auth-route-runtime`: Update the gated V0 bootstrap route to support the
  preview cookie policy without becoming a production login provider.
- `operator-v0-session-workflow`: Clarify that V0 browser workflows can be
  verified on the public HTTP preview only through the explicit internal preview
  mode.

## Impact

- Affected code: `apps/web/src/server/auth/*`, V0 auth route handling, and local
  auth/operator V0 verification scripts.
- Affected docs: auth contract, Docker/preview documentation, architecture
  roadmap, AI continuous-development goal, and autonomous-development roadmap.
- No new npm dependency, database table, provider SDK, queue, object storage, or
  production deployment provider.
- Security posture: this introduces an intentionally weaker cookie transport
  only for an internal, explicitly enabled V0 preview. It must stay disabled by
  default and must not be used for real customer, order, transcript, pricing, or
  supplier data.
- Rollback path: unset the preview flag and redeploy; the runtime falls back to
  secure-by-default cookies. Code rollback removes the preview cookie override
  helpers and verification updates.
