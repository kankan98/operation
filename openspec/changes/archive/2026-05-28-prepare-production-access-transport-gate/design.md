## Context

The project has an internal V0 trial cockpit, protected local-only business
Route Handlers, provider-neutral auth guard/session/cookie runtime, Docker
preview, and a high-level V1 production gate. The high-level gate correctly
blocks controlled real-data trial, but its "production access" and "HTTPS
domain" items are still too broad to drive the next implementation wave.

This change belongs to technical roadmap stages 2 and 9 planning:

- Stage 2: authentication, tenant/team, session, invitation, team switching,
  CSRF/origin, and provider boundary requirements.
- Stage 9 planning: transport, domain, TLS, preview/production separation, and
  deployment safety requirements.

It does not introduce provider runtime, domain provisioning, TLS certificates,
reverse proxy, production database, or real sensitive data entry.

## Goals / Non-Goals

**Goals:**

- Define a production-access-and-transport readiness model that is deterministic
  and provider-free.
- Break the top two V1 production blockers into actionable gate items with
  current evidence, blockers, next actions, and pass criteria.
- Keep the top-level V1 gate conservative: production access and HTTPS may be
  planned, but controlled real trial remains blocked.
- Render a compact internal readiness detail in the existing cockpit so team
  leads can understand what implementation wave comes next.
- Update auth contract and roadmaps so future provider/HTTPS implementation has
  a clear pre-agreed boundary.
- Verify the behavior locally without secrets, providers, real domain, real
  certificates, customer data, or external accounts.

**Non-Goals:**

- No Auth.js, Clerk, Auth0, Descope, OAuth, magic-link, password, SSO, or hosted
  identity provider implementation.
- No public login page, provider callback, invitation email delivery, team
  admin UI, role-management UI, or production team switcher.
- No domain purchase, DNS change, ACME client setup, reverse proxy, HSTS rollout,
  production hosting provider, or TLS certificate issuance.
- No production database, backup/restore, observability provider, analytics SDK,
  external queue, object storage, RAG runtime, or platform integration.
- No real customer/order/private-message/transcript/pricing/supplier data entry.

## Decisions

1. **Use a static, typed gate model instead of environment probing.**
   - Rationale: The project does not yet have production provider, domain, or
     TLS decisions. Probing environment variables would either be meaningless or
     risk encouraging secret/config sprawl.
   - Alternative considered: detect `NEXTAUTH_URL`, proxy headers, or certificate
     config. Rejected because no provider or deployment target is accepted.

2. **Split the gate into access and transport sections while keeping one
   coherent capability.**
   - Rationale: Auth and HTTPS must pass together before real data entry; a
     secure cookie policy depends on HTTPS, and production login depends on
     route/session/CSRF/origin behavior.
   - Alternative considered: create separate auth-provider and HTTPS proposals.
     Rejected because that would repeat the recent one-or-two-endpoint
     fragmentation problem and miss the shared real-data trial boundary.

3. **Represent readiness as `blocked`, `planned`, or `ready`, with no `passed`
   state for this planning wave.**
   - Rationale: The wave can make planning ready but cannot make runtime
     provider or HTTPS behavior pass. "Ready" means ready for the next
     implementation proposal, not ready for real data.
   - Alternative considered: use only blocked/deferred. Rejected because the
     user asked to accelerate delivery; after this wave, the project should show
     that the implementation scope is planned rather than still generic.

4. **Update the existing cockpit instead of creating a new route.**
   - Rationale: V1 readiness is already surfaced there. A separate admin page is
     warranted only when production provider or operational runtime exists.
   - Alternative considered: new `/production-readiness` route. Deferred to a
     future production ops/admin wave.

5. **Record provider-selection criteria, not a provider choice.**
   - Rationale: A production provider decision depends on account ownership,
     domain/email setup, China/network reachability, data processing boundaries,
     cost, and team-management needs. Those cannot be proven from the repo.
   - Alternative considered: install Auth.js immediately because it is compatible
     with Next.js. Rejected because it would create provider/runtime work before
     external account and production policy decisions are ready.

6. **Keep source-based conclusions as requirements, not product UI copy.**
   - Rationale: OWASP/Next.js/MDN/Let's Encrypt inform security gates, but users
     need short operator-facing labels. Detailed rationale belongs in OpenSpec
     and contracts.

## Risks / Trade-offs

- **Risk: Planning gate is mistaken for implemented production auth.** →
  Mitigation: UI and checks keep `controlledRealTrialReady=false`, require
  production runtime implementation before pass, and label current state as
  planned rather than open.
- **Risk: Gate creates duplicate auth concepts.** → Mitigation: model stays
  readiness-only and references the existing `AuthPort`, app-owned session,
  cookie, route, and authorization guard boundaries.
- **Risk: Provider decision is delayed.** → Mitigation: the gate lists concrete
  provider-selection criteria and names the next wave as provider/transport
  implementation, making the remaining decision explicit.
- **Risk: Cockpit becomes dense.** → Mitigation: show only two compact sections,
  six to eight high-signal gate items, top blockers, and next implementation
  action.
- **Risk: Static gate can drift.** → Mitigation: local verifier covers gate
  count, ordering, statuses, no-secret output, top-level V1 linkage, and next
  wave text.

## Migration Plan

1. Add the provider-free readiness model and first failing local verifier.
2. Implement the model and update top-level V1 gate workflow linkage.
3. Render the detailed access/transport panel in the existing cockpit.
4. Update package scripts, auth contract, roadmap, and accepted specs through
   this OpenSpec change.
5. Run local checks, OpenSpec validation, lint/type/build, and Playwright before
   archive.
6. Archive, commit with Conventional Commit, push, rebuild Docker preview, and
   smoke public routes.

Rollback is a normal code revert. No migration or persisted data is introduced.

## Open Questions

- Which auth provider should be selected for production login? The next
  implementation wave must compare Auth.js/self-hosted, hosted identity, and
  business-account constraints against the criteria in this gate.
- Which domain and TLS path will be used? Requires user/account control of DNS
  or a deployment provider decision.
- Whether public V1-Lite should be single-team first or include full team
  invitation immediately. This gate preserves both but recommends single-team
  controlled trial until invitation delivery is verified.
