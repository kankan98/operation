## Why

The internal V0 trial is reachable and can collect feedback, but first-time
evaluators still have to create enough records before they can see the full
"session -> racket -> knowledge -> AI review -> talk track -> next task"
operator story. This slows evaluation, weakens feedback quality, and keeps the
project short of a usable V0 even though most runtime surfaces already exist.

Pre-proposal research and value exploration:

- GOV.UK Service Manual user research guidance was checked as an official
  public-service source. It supports planning around concrete users, priority
  research questions, and low-effort evidence rounds, so this wave should help
  evaluators try the real workflow faster instead of asking them to assemble
  setup data first.
- Nielsen Norman Group usability guidance was checked as a professional UX
  source. It supports small, iterative usability testing to uncover major
  workflow issues quickly, so V0 should provide enough realistic demo context
  for a few evaluator sessions to be meaningful.
- NIST Privacy Framework was checked as a standards-body source for privacy
  risk management. It confirms this wave must use de-identified/demo-only
  records and must not invite real customer, order, private message, supplier,
  pricing, or full transcript data into the HTTP preview.
- NIST AI RMF was checked as a standards-body source for AI governance. It
  supports keeping AI output labeled, reviewed, and traceable rather than
  treating seeded AI review content as authoritative business truth.
- Opportunity-tree exploration identified the highest-value V0 opportunity:
  reduce first-run setup friction so live operators, team leads, and evaluators
  can inspect a complete operator workflow and provide actionable feedback.
- UI/UX skill guidance recommended a dense dashboard/demo pattern. The project
  decision is to adapt that into compact, operator-facing guidance and stable
  progress cards, not a marketing landing page or decorative demo tour.

## What Changes

- Add a local-only V0 demo dataset capability for the deterministic internal
  trial team.
- Seed or reuse one safe, realistic badminton racket live-commerce scenario
  when the V0 trial bootstrap creates or verifies the internal demo team:
  - one review-ready live session capture
  - one reviewed/published racket product with source metadata
  - one approved/published knowledge source/claim/note slice
  - one review-ready or accepted local V0 AI review run with traceable fake
    provider metadata
  - one downstream talk-track draft
  - one next-session task with checklist
- Keep demo data idempotent and scoped to the deterministic V0 tenant/team; do
  not duplicate records every time an evaluator enters trial.
- Extend `/trial` and `/` cockpit guidance so evaluators know what to try first,
  which sample scenario is loaded, and that only demo/de-identified data belongs
  in this preview.
- Extend local trial verification so it proves demo seeding, readiness counts,
  safe redaction, idempotency, and feedback compatibility.
- Update roadmap/goal docs to reflect V0 sample-data quality as completed or
  advanced after this wave.

No production login, HTTPS/domain decision, RAG, Q&A runtime, external source
discovery, external analytics, live AI call, new table, new dependency, or real
business-data ingestion is introduced.

## Capabilities

### New Capabilities

- `v0-trial-demo-data`: local-only demo data seeding, scenario guidance, and
  verification for the internal V0 trial path.

### Modified Capabilities

- None.

## Impact

- Affected app areas: `apps/web/src/server/auth/operator-v0.ts`,
  new or updated server-side trial demo seed helpers, local trial/auth check
  scripts, trial readiness/client helper code if needed,
  `apps/web/src/components/internal-trial-access.tsx`, and roadmap docs.
- Data impact: uses existing local-only V0 PostgreSQL tables and deterministic
  tenant/team scope. No migration is planned unless implementation evidence
  shows an existing table cannot represent the sample scenario.
- API impact: the existing V0 bootstrap route may ensure demo records before
  returning the session body, while preserving current CSRF, enabled flag,
  no-store response, cookie/session, and safe JSON behavior.
- Security impact: demo records must be de-identified, must not include real
  customer/order/private-message/full-transcript/supplier/pricing strategy
  content, and must not expose raw cookies, session references, database URLs,
  provider keys, authorization headers, stack traces, raw prompts, or provider
  payloads.
- UX impact: `/trial` and `/` should remain operational cockpit surfaces with
  compact Chinese guidance, not a marketing landing page.
- Dependency impact: no new runtime or development dependencies.
- Verification impact: OpenSpec validation, new or updated local demo-data
  check, affected trial/auth/feedback checks, lint, typecheck, build,
  Playwright before archive, then archive, conventional commit, push, Docker
  redeploy, and public smoke.
