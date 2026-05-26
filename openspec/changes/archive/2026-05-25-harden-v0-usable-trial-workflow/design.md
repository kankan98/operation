## Context

The current V0 has implemented pages and protected list APIs for `/sessions`,
`/rackets`, `/knowledge`, `/ai-review`, `/talk-tracks`, and `/next-actions`.
The public preview can enter a deterministic demo team through trial access, and
the local `trial-mvp:check` already proves route-gate, bootstrap, session,
logout, protected list access, and redaction boundaries.

The remaining V0 usability gap is evaluator orientation. A user can open all six
workbenches, but the overview does not yet summarize which workflow records
exist, what the next useful action is, or whether the trial path is still empty.
This change stays inside the existing architecture: browser UI, shared client
helper, protected Route Handlers, server-side auth/session/scope, repositories,
and no-store JSON responses.

## Goals / Non-Goals

**Goals:**

- Show a verified trial evaluator a compact V0 workflow summary from the six
  implemented workbenches.
- Recommend the next useful workbench based on existing scoped record counts.
- Keep loading, retry, refresh, logout, empty, and ready states visible in
  operator-facing Chinese.
- Reuse existing protected list APIs and client trial-scope helpers.
- Extend local verification so the readiness summary cannot silently drift from
  route response shapes or safe redaction expectations.
- Update roadmap docs with a clear internal V0 completion boundary and
  accelerated delivery plan.

**Non-Goals:**

- No production login provider, public registration, invitation, team switching,
  or real customer-data onboarding.
- No new database tables, migrations, persistence models, or external services.
- No RAG/Q&A runtime, public source discovery, queue, object storage, analytics,
  observability provider, or commerce/Douyin integration.
- No live DeepSeek call in default verification and no committed AI secrets.
- No marketing landing page or decorative redesign.

## Decisions

### Use a client-side readiness model over a new aggregate API

The overview will fetch the existing scoped protected list APIs after the trial
session is verified and derive a safe summary from the collection keys already
returned by those routes.

Alternatives considered:

- New `/api/trial/summary` aggregate route: cleaner single request, but creates
  a new server boundary before there is a production trial/tenant product
  contract. It also duplicates repository wiring that the existing list routes
  already verify.
- Static checklist only: fast, but does not answer the evaluator's real
  question: "What exists in this demo team and what should I do next?"

Rationale: client-side aggregation is enough for V0, keeps authorization at the
existing protected APIs, and is easy to replace with a server aggregate route in
V1 if performance or pagination becomes an issue.

### Define a shared pure readiness helper

Create a small helper that defines the six workflow steps, response collection
keys, count extraction, safe step status, and next-step selection. UI code uses
the helper for rendering; `trial-mvp:check` uses the same helper for regression
coverage.

Alternatives considered:

- Put all logic inside the React component: quicker, but harder to verify
  without browser-only tests and easier to drift from route response shapes.
- Put workflow steps only in `workspace.ts`: useful for navigation, but it mixes
  static navigation copy with dynamic API response parsing.

Rationale: this is stable domain/UI-adjacent logic, not persistence or AI logic.
Keeping it pure and typed avoids a new runtime dependency.

### Keep UI copy user-facing and bounded

The cockpit should say what an operator can do next: "先记录直播场次", "已有 2 条",
"继续复盘". It must not display OpenSpec, database, cookie, RAG, provider, or
implementation language.

Alternatives considered:

- Show technical readiness details: useful for agents, but normal product UI
  would become internal documentation.
- Hide limitations completely: makes the preview look more production-ready than
  it is.

Rationale: V0 should be honest as an internal/demo trial while still feeling like
a usable product surface.

## Risks / Trade-offs

- Client aggregation creates up to six list requests on the overview after trial
  verification → Mitigation: only run after a verified session, use existing
  no-store protected endpoints, keep responses lightweight, and provide retry.
- Count-based readiness may overstate quality because a record can exist but
  still be incomplete → Mitigation: label it as V0 progress, not production
  quality; workbench-level readiness remains authoritative.
- Existing route response keys can drift → Mitigation: centralize keys in the
  readiness helper and test extraction through `trial-mvp:check`.
- Public HTTP preview remains internal/demo only → Mitigation: keep docs and UI
  copy bounded to演示/脱敏 data and retain post-archive Docker/Playwright smoke.
