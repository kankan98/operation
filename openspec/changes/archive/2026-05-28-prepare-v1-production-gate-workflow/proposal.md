## Why

Internal V0 is effectively frozen for demo-data trial, but the next useful step
is not another small V0 panel; it is a clear production gate that tells team
leads what still blocks a controlled real-data V1 trial. This change turns the
existing "prepare production gate" signal into a bounded, operator-facing
readiness workflow without selecting new auth, hosting, monitoring, backup, or
AI/RAG providers.

## What Changes

- Add a deterministic V1 production gate model that groups readiness into
  production access, deployment transport, data recovery, sensitive-data
  handling, AI release quality, and operations observability.
- Render a compact V1 production gate surface inside the existing overview and
  `/trial` cockpit when a verified trial session is available.
- Keep each gate as planned, blocked, or deferred using current project evidence;
  do not claim production readiness from internal V0 evidence alone.
- Recommend the next coherent OpenSpec wave from the gate results so future work
  can move faster without fragmenting into one- or two-endpoint proposals.
- Update roadmap documentation so the project clearly moves from V0 freeze to
  V1 controlled-real-trial prerequisites.
- No new provider SDK, production login route, production database provider,
  external telemetry, queue, object storage, or RAG runtime is introduced.

## Capabilities

### New Capabilities

- `v1-production-gate-workflow`: deterministic V1 gate assessment and compact
  trial/overview UI for controlled real-trial prerequisites.

### Modified Capabilities

- `v0-trial-evidence-review`: extend the V0 production-gate handoff so the
  dedicated V1 gate workflow is the next action when internal V0 evidence is
  strong enough to freeze.

## Impact

- Affected code:
  - `apps/web/src/lib/*` readiness model and check script.
  - `apps/web/src/components/internal-trial-access.tsx` trial/overview cockpit.
  - `apps/web/package.json` and root `package.json` check scripts.
- Affected docs/specs:
  - `openspec/specs/v1-production-gate-workflow/spec.md`
  - delta for `v0-trial-evidence-review`
  - roadmap and goal documents.
- Dependencies: none.
- Security/data: no real credentials, secrets, prompts, raw transcripts, customer
  data, or production database configuration are stored or rendered.

## Source Notes

- OWASP Authentication and Session Management Cheat Sheets and ASVS guidance
  confirm that production access must include server-side authentication,
  secure session handling, and transport/security controls before real protected
  data is treated as production-ready.
- OWASP Logging guidance supports making log redaction and sensitive-payload
  exclusion an explicit production gate rather than a later UI polish item.
- Next.js authentication guidance reinforces keeping authorization checks in a
  server-side data access boundary, matching the existing project guard/session
  direction.
- PostgreSQL backup documentation confirms backup/restore is a real operational
  prerequisite for protected data use, not a cosmetic readiness item.
- NIST AI RMF confirms that AI behavior needs govern/map/measure/manage style
  risk controls; therefore production AI/RAG release remains gated on formal
  evaluation and human-review boundaries.
- Docker restart policy documentation supports retaining `--restart
  unless-stopped` for preview recovery while keeping production hosting and SSL
  as separate gates.

## Skill-Backed Value Exploration

- `openspec-explore`: current evidence says V0 should freeze and hand off to a
  production gate rather than continue adding disconnected V0 widgets.
- `roadmap-planning` and `prioritization-advisor`: this is a Now/Next transition
  from V0 trial to V1 controlled-real-trial prerequisites; value/effort is the
  right frame because usage data is still sparse.
- `ui-ux-pro-max`: use a calm, dense operational status surface with clear
  labels, not a marketing-style hero or decorative visual treatment.
- Target users: team leads and live operations owners deciding whether they can
  move from demo/internal data to limited real usage.
- User outcome: they can see what is ready, what blocks real data, and which
  next development wave removes the highest-risk prerequisite.
