## Context

The project now has a local V0 browser loop for `/sessions -> /ai-review -> /talk-tracks /next-actions`. The remaining first-screen gaps are `/rackets` and `/knowledge`: both render useful static guidance, but neither lets an operator maintain the product facts or reviewed knowledge that AI review and future Q&A should rely on.

Existing runtime boundaries are already in place:

- Racket product create/list Route Handlers, product/source/review/publish repository methods, local checks, and accepted contracts.
- Knowledge lifecycle source/claim/team-note/review/conflict/publish Route Handlers, repository methods, local checks, and accepted contracts.
- App-owned session cookie/request resolver and local V0 bootstrap route.
- The current V0 bootstrap intentionally does not grant `manage_products` or `review_knowledge`, so browser workbenches cannot exercise these APIs yet.

This wave remains local-only stage 4 reference-data runtime. It reuses existing Route Handlers and local PostgreSQL and does not introduce production login, public crawling, RAG, live AI, new tables, new dependencies, queues, object storage, analytics, or production database provider decisions.

## Goals / Non-Goals

**Goals:**

- Reuse the same local V0 team context pattern across `/rackets` and `/knowledge`.
- Extend only the internal V0 permission override with `manage_products` and `review_knowledge`; leave global role policy unchanged.
- Replace static `/rackets` behavior with scoped product list/create and clear source/review/readiness states.
- Replace static `/knowledge` behavior with scoped source list/create, manual claim/team-note creation where useful, review queue, review decision, conflict/publish visibility, and safe operator feedback.
- Preserve provenance and review status so product/knowledge inputs do not become AI-authoritative facts without human review.
- Keep UI concise, Chinese, dense, accessible, and mobile-safe with visible labels and request feedback.
- Add repeatable local checks and Playwright verification.

**Non-Goals:**

- No production auth provider, public signup, middleware-wide route protection, team switching, invite flow, HTTPS strategy, or public trial hardening.
- No live DeepSeek calls, RAG snapshot, Q&A generation, web discovery, scraping, source refresh jobs, queues, notifications, exports, analytics, or external commerce platform integrations.
- No product edit/archive UI unless the existing accepted API route already supports it safely.
- No automatic publication of product facts or knowledge versions from browser input.
- No new npm dependencies, database tables, migrations, provider SDKs, or storage services expected.
- No Server Action wrappers in this wave; existing protected Route Handlers remain the runtime boundary.

## Decisions

1. **Bundle `/rackets` and `/knowledge` in one reference-data proposal.**
   - Rationale: both pages solve the same V0 problem: maintaining trustworthy upstream facts before AI review, talk tracks, next actions, and future Q&A. They share V0 auth, explicit tenant/team scope, safe request helpers, provenance labels, and verification.
   - Alternative considered: implement only product UI. Rejected because product facts without source/knowledge review still leave AI grounding and team trust weak.

2. **Reuse existing Route Handlers instead of Server Actions.**
   - Rationale: product and knowledge Route Handlers already enforce auth cookie/session, tenant/team scope, CSRF, repository rules, no-store responses, and rollback checks. Server Actions would add a second boundary without improving V0 value.
   - Alternative considered: Server Actions for forms. Deferred as a thin later wrapper after the browser workflows prove the payloads and states.

3. **Extend local V0 permission overrides only.**
   - Rationale: the internal V0 operator needs `manage_products` and `review_knowledge` to exercise reference-data flows, but changing the global `operator` role would alter authorization semantics outside V0.
   - Alternative considered: grant `operator` role more permissions. Rejected because product management and knowledge review are broader team responsibilities.

4. **Keep browser payload builders separated by domain.**
   - Racket product payloads cover product identity, aliases, specs, audience, play style, selling focus, limitations, and product-source metadata where supported.
   - Knowledge payloads cover source metadata, manual claims, team notes, review decisions, conflicts, and version publication where supported.
   - Rationale: the two domains share scope/error helpers but have different validation, permissions, and review semantics.

5. **Expose review and publication as gated workflow states, not automatic saves.**
   - Rationale: W3C provenance and AI governance guidance both point to explicit source/claim/team-note/review/version relationships. Browser creation should produce draft/pending records; review and publish actions must show blockers and safe failures.
   - Alternative considered: auto-approve local V0 records for faster demo. Rejected because it would train the product in the wrong direction.

6. **Use mobile card/list layouts rather than dense tables.**
   - Rationale: UI/UX guidance flags mobile table overflow and missing submit feedback as high-risk. Product and knowledge rows should stack on mobile, keep labels visible, and preserve stable action buttons.

## Risks / Trade-offs

- **V0 permissions become broader** -> Limit changes to deterministic V0 membership override and verifier; do not change `ROLE_PERMISSIONS`.
- **Product and knowledge workbench components may grow large** -> Extract shared reference-data helpers into `src/lib`; split page components if domain sections become difficult to test.
- **Existing APIs may not expose every source/review/publish repository method through HTTP** -> Only build browser actions against accepted Route Handlers. Show unavailable/gated states for repository-only behavior and record follow-up tasks instead of bypassing boundaries.
- **Duplicate or invalid source/product inputs can frustrate operators** -> Reuse route conflict responses, disable in-flight buttons, and show safe Chinese recovery text without leaking raw protected payloads.
- **Public HTTP preview cannot prove Secure-cookie authenticated flows** -> Run full authenticated Playwright locally; public preview verifies rendered entry states and route availability until HTTPS/provider login is defined.
- **Reference data can look authoritative too early** -> Keep draft/pending/reviewing/published labels visible and separate human-entered records from AI-ready/published records.

## Migration Plan

1. Add OpenSpec specs and tasks for the reference-data V0 workflow.
2. Extend local V0 bootstrap permission overrides and verifier for product/knowledge permissions.
3. Add shared reference-data browser helpers for scope, CSRF, API error mapping, and typed payload builders.
4. Replace `/rackets` static workbench with V0 list/create/source/review/readiness workflow using accepted product APIs.
5. Replace `/knowledge` static hub with V0 source/claim/team-note/review/publish workflow using accepted knowledge APIs.
6. Add or extend rollback-based local workflow checks for V0 reference-data browser payloads.
7. Update README, roadmap, and accepted-status notes.
8. Verify OpenSpec, local route/workflow checks, lint, typecheck, build, and Playwright before archive.

Rollback path:

- Revert the V0 permission override additions.
- Restore `/rackets` and `/knowledge` static components.
- Remove shared reference-data browser helpers and new local workflow checks.
- Existing repository/API runtime remains valid because this wave only adds browser workflows on top of accepted APIs.

## Open Questions

- Product source/review/publish HTTP coverage may be narrower than repository coverage; implementation should expose only accepted Route Handler behavior and leave missing API surfaces as future OpenSpec work.
- A public trial still needs HTTPS and production auth before authenticated browser workflows can be considered reliable on the public IP.
- Dedicated RAG snapshot and Q&A grounding remain later stages after reference data can be maintained and reviewed in the browser.
