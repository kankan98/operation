## Context

The project already has the important local V0 runtime pieces:

- app-owned session ledger and auth guard;
- server-only cookie helpers that issue `HttpOnly; Secure; SameSite=Lax`
  session cookies;
- `POST /api/auth/operator-v0-session`, gated by environment and a custom CSRF
  header, that seeds one deterministic internal tenant/team/operator context;
- V0 browser workflows for `/sessions`, `/rackets`, `/knowledge`,
  `/ai-review`, `/talk-tracks`, and `/next-actions`;
- Docker public preview at `http://203.195.161.93:3000/`.

The blocker is transport policy. A public HTTP IP cannot receive or send a
standard `Secure` session cookie, so the existing public preview can render
pages but cannot prove the complete authenticated browser loop. A real
production fix is HTTPS plus production login, but that requires domain/SSL and
provider decisions outside the fastest internal V0 wave.

## Goals / Non-Goals

**Goals:**

- Make the existing public Docker preview usable for internal V0 workflow
  evaluation without requiring a local development server.
- Keep the auth runtime secure by default.
- Require two gates for HTTP preview cookies:
  `OPERATION_ENABLE_V0_BOOTSTRAP=1` and an explicit insecure-preview cookie
  flag.
- Shorten insecure V0 preview session lifetime.
- Ensure logout and missing-cookie clear paths use a matching cookie policy so
  browsers can actually remove preview cookies.
- Extend local verification before deployment and Playwright pre-archive checks.
- Record the limitation clearly in durable docs.

**Non-Goals:**

- No production login provider, OAuth, password auth, magic link, Auth.js,
  provider callback, team management, invitation flow, middleware-wide route
  protection, or real multi-user onboarding.
- No HTTPS/domain/certificate automation in this wave.
- No real AI provider switch or DeepSeek secret deployment. `/ai-review`
  continues to use the existing V0 fake-provider route unless a later OpenSpec
  changes model policy.
- No storage of real customer, order, private-message, supplier, inventory, or
  pricing data in the HTTP preview.
- No new dependency or database migration.

## Decisions

### 1. Add a request-aware cookie policy override

Keep the default `authSessionCookieOptions.secure = true`. Add typed cookie
serialization options so callers can issue or clear a cookie with
`secure: false` only when a dedicated internal preview policy says it is
allowed.

Alternative considered: globally set `secure: false` in preview builds. Rejected
because it would silently weaken every future auth path and conflict with the
accepted cookie runtime.

Alternative considered: leave the preview unauthenticated until HTTPS exists.
Rejected because it prevents internal evaluators from testing the already built
V0 save/review/downstream workflow and slows user-value feedback.

### 2. Gate insecure cookies behind V0 bootstrap and a second flag

The preview policy will be available only when both are true:

- `OPERATION_ENABLE_V0_BOOTSTRAP=1`
- `OPERATION_ALLOW_INSECURE_V0_PREVIEW_COOKIE=1`

Development mode may still use the default local behavior, but public HTTP
preview cannot silently opt into non-secure cookies. This makes the operational
choice explicit during Docker deployment.

Alternative considered: infer from request URL protocol. Rejected because proxy
headers and local/public differences can be ambiguous, and security-affecting
behavior should not depend only on a request URL.

### 3. Keep the session scope V0-only and short-lived

When insecure preview cookie mode is active, the bootstrap route will create the
same deterministic V0 operator/team context but use a shorter max age for both
the session ledger and the browser cookie. This reduces exposure if the HTTP
preview cookie is copied.

Alternative considered: reusing the seven-day session lifetime. Rejected
because HTTP preview transport is intentionally weaker and should not inherit
long-lived session behavior.

### 4. Make clear-cookie behavior policy-aware

Cookie deletion must use the same name/path and compatible attributes as the
cookie that was issued. Extend logout and idempotent clear paths to use the
preview cookie policy when the explicit flag is active so HTTP preview sessions
can be removed from the browser.

Alternative considered: only invalidate the server ledger. Rejected because the
browser would continue sending a stale cookie until it expires, creating noisy
errors and confusing internal testers.

### 5. Do not change AI model behavior in this wave

The next product milestone is usable internal workflow feedback, not model
quality evaluation. Keeping `/ai-review` on the existing V0 fake-provider route
avoids deploying secrets into an HTTP public preview and avoids conflating
transport/auth validation with AI provider quality.

Alternative considered: switch V0 AI execution to DeepSeek now. Rejected for
this wave because it would require secret deployment, provider failure
operation, cost/rate-limit handling, and quality verification that belong in a
separate AI production-provider wave.

## Risks / Trade-offs

- Insecure HTTP cookies can be observed on the network -> Only enable through an
  explicit preview flag, keep V0-only deterministic demo scope, shorten
  lifetime, document that real sensitive data must not be entered, and preserve
  `Secure` default for all non-preview paths.
- Users may mistake internal preview access for production login -> Use docs and
  roadmap language to label it as internal V0 preview, and do not add generic
  account UI.
- A future production login route could accidentally reuse preview policy ->
  Keep the preview helper named for V0/internal preview and require the V0
  bootstrap enablement flag as part of its gate.
- Logout may fail to clear an insecure preview cookie if attributes diverge ->
  Use the same cookie policy helper for issue and clear headers; verify with a
  route-level check.
- Docker deploy could miss the new flag -> Update preview commands/docs and add
  post-archive public smoke verification.

## Migration Plan

1. Add/extend OpenSpec specs and validate the change.
2. Update auth cookie helpers and V0 bootstrap route with the gated preview
   policy.
3. Extend local auth/operator V0 checks.
4. Update docs/roadmap with preview mode and security limitations.
5. Run OpenSpec, lint, typecheck, build, auth/operator checks, and relevant V0
   route checks.
6. Before archive, run Playwright browser checks against local preview mode.
7. After archive, commit with Conventional Commit, push, redeploy Docker with
   the explicit preview flags, and verify the public URL.

Rollback: remove or unset `OPERATION_ALLOW_INSECURE_V0_PREVIEW_COOKIE`; the
public preview returns to rendered-only behavior with secure-by-default cookies.
