## Why

Internal V0 is effectively usable for demo-data trial, and the current V1 gate
already identifies production access and HTTPS as the next blocker. The project
now needs a coherent production-access-and-transport gate so team leads can see
what must be true before limited real data is allowed, without prematurely
installing an auth provider or provisioning a domain.

## What Changes

- Add a deterministic production access and HTTPS transport gate model covering
  provider decision, public login route, session lifecycle, invitations, team
  switching, CSRF/origin checks, secure cookies, domain, TLS, HTTP redirect, and
  production/preview separation.
- Render a compact detailed gate surface inside the existing V1 production gate
  cockpit so the next implementation wave is actionable rather than a generic
  "auth/HTTPS blocked" label.
- Update the top-level V1 production gate workflow so production access and
  HTTPS are shown as planned-but-not-passed after this gate is accepted; the
  controlled real trial remains blocked until runtime implementation and
  verification pass.
- Update the auth/team/tenant contract and roadmap docs with provider-selection
  criteria, transport requirements, sensitive-data boundaries, and the next
  coherent implementation wave.
- Add a provider-free local verifier and scripts for the new gate behavior.
- No production auth provider, SDK, hosted identity service, public login route,
  provider callback, real domain, TLS certificate, reverse proxy, production DB,
  backup service, observability provider, external analytics, queue, object
  storage, or real customer data entry is introduced.

## Capabilities

### New Capabilities

- `production-access-transport-gate`: detailed planning and verification gate
  for production login/team access and HTTPS transport prerequisites before a
  controlled real-data V1 trial.

### Modified Capabilities

- `v1-production-gate-workflow`: top-level V1 gate now delegates production
  access and HTTPS blockers to the detailed gate while keeping real trial
  blocked.
- `auth-team-tenant-contract`: contract records production provider-selection,
  invitation/team switching, CSRF/origin, secure-cookie, and HTTPS requirements
  that must be satisfied before production auth runtime work is accepted.

## Impact

- Affected code:
  - `apps/web/src/lib/*` gate model and local verifier.
  - `apps/web/src/components/internal-trial-access.tsx` production readiness
    cockpit.
  - root and web package scripts for the local verifier.
- Affected docs/specs:
  - new `production-access-transport-gate` spec.
  - deltas for `v1-production-gate-workflow` and
    `auth-team-tenant-contract`.
  - `docs/contracts/auth-team-tenant.md`, roadmap, technical roadmap, and goal
    docs.
- Dependencies: none.
- Security/data: the change is provider-free and must not expose or persist API
  keys, cookies, session references, database URLs, provider payloads, raw
  prompts, raw transcripts, customer private data, or production credentials.

## Source Notes

- Next.js official authentication guidance treats authentication as a server
  concern and recommends secure cookie/session handling around protected
  routes, matching the project's provider-neutral `AuthPort` boundary:
  `https://nextjs.org/docs/app/guides/authentication`.
- OWASP Authentication, Session Management, CSRF, and Transport Layer Security
  Cheat Sheets support making login, session lifecycle, CSRF/origin checks,
  secure cookies, and TLS explicit gates before real protected data is used:
  `https://cheatsheetseries.owasp.org/`.
- MDN cookie guidance documents `HttpOnly`, `Secure`, and `SameSite` attributes,
  supporting the rule that production cookies must not rely on the current
  internal HTTP preview exception:
  `https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie`.
- Let's Encrypt getting-started guidance confirms that real HTTPS requires a
  controlled domain/certificate flow, so the current HTTP IP preview cannot be
  treated as production transport:
  `https://letsencrypt.org/getting-started/`.

## Skill-Backed Value Exploration

- `openspec-explore`: current project evidence points to a stage-level
  production gate, not another isolated endpoint or UI-only polish.
- `roadmap-planning` and `prioritization-advisor`: with sparse real usage data
  and a small delivery team, value/effort sequencing favors removing production
  blockers in coherent V1-Lite waves.
- `ui-ux-pro-max`: adapt the dashboard recommendation into a dense,
  Chinese, operator-facing readiness panel; avoid marketing copy, heavy
  decoration, and hidden technical jargon.
- Target users: team leads, operations owners, and administrators deciding
  whether the product can move from demo/internal data to a controlled real-data
  trial.
- User outcome: they can tell exactly why real data is still blocked, what has
  been planned, and which production access/HTTPS implementation wave should
  happen next.
