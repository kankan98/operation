## Context

The project has a Docker-backed internal V0 preview and a six-workbench trial
workflow. The accepted V0 evidence review can recommend production-gate
planning, but it currently only lists gate labels. Team leads still need a
clear V1 decision surface that explains which prerequisites block limited real
usage and which OpenSpec wave should remove the next blocker.

This change sits between internal V0 freeze and production implementation. It
belongs to the production-readiness planning part of the technical roadmap, but
does not enter provider implementation for auth, deployment, backups,
observability, RAG, queue, or object storage.

## Goals / Non-Goals

**Goals:**

- Derive a deterministic V1 gate assessment from current project state and V0
  trial cockpit signals.
- Present gate status in the existing overview and `/trial` surfaces after a
  verified trial session.
- Make the next development wave explicit enough to speed up execution without
  fragmenting proposals.
- Keep sensitive data, secrets, provider config, raw prompts, and raw protected
  records out of the gate UI and check output.
- Update durable roadmap documentation to make V0 freeze and V1 gate planning
  the current path.

**Non-Goals:**

- No production auth provider, public login route, invitation delivery, team
  switching UI, or provider SDK.
- No domain/SSL provisioning, production host selection, backup service,
  observability provider, analytics SDK, queue, object storage, or external
  platform integration.
- No live AI model release expansion, RAG/Q&A runtime, source discovery, or
  production evaluation runner implementation.
- No new database tables or persistence source; the gate is derived from static
  accepted project status and existing V0 cockpit state.

## Decisions

1. **Use a deterministic local model, not a persisted checklist.**
   - Rationale: Current V1 gates are architectural prerequisites, not user-entered
     tasks. Persisting them would imply a production operations system that does
     not exist yet.
   - Alternative considered: add a database-backed readiness table. Rejected
     because it adds persistence and permissions before the production gate itself
     is accepted.

2. **Group gates by production risk, not by implementation file.**
   - Groups: access, transport/deployment, recovery, sensitive data,
     AI/RAG/evaluation, observability.
   - Rationale: Team leads care about whether real data can be used safely, not
     which module owns the work.
   - Alternative considered: one gate per accepted spec. Rejected because it
     would be too noisy and would hide real-world prerequisites such as HTTPS and
     backup/restore.

3. **Render the gate only inside the existing internal trial cockpit surfaces.**
   - Rationale: V1 readiness is a handoff from V0 trial evidence; creating a new
     route now would add navigation weight without new runtime capability.
   - Alternative considered: new `/production-readiness` page. Deferred until a
     future provider/ops implementation needs a dedicated admin surface.

4. **Keep current gate statuses conservative.**
   - V0 trial evidence and Docker restart policy can be marked as supporting
     evidence.
   - Production login, HTTPS/domain, backup/restore, sensitive data governance,
     formal AI/RAG evaluation, and observability remain blocked or deferred.
   - Rationale: This prevents the UI from converting internal demo readiness into
     production readiness.

5. **Use existing visual primitives and compact copy.**
   - Rationale: `ui-ux-pro-max` results included some marketing-heavy patterns,
     which conflict with the project rules. The adapted direction is a dense
     operational status panel with badges, short labels, and stable cards.

## Risks / Trade-offs

- **Risk: Gate UI may feel like production is almost done.** Mitigation: every
  status is conservative and the summary states that controlled real trial is
  still blocked until production gates pass.
- **Risk: Static status can drift from code reality.** Mitigation: add a local
  verifier covering gate order, statuses, redaction, and the next wave, and
  update roadmap docs in the same change.
- **Risk: More cockpit content can overload `/trial`.** Mitigation: keep the
  panel compact, use at most six gate cards, and render concise Chinese copy.
- **Risk: The first V1 gate wave could be too broad.** Mitigation: the gate
  recommends a coherent next OpenSpec wave, not implementation of all production
  gates at once.

## Migration Plan

1. Add the model and verifier.
2. Render the compact panel in existing trial/overview readiness cockpit.
3. Update roadmap and goal docs.
4. Validate OpenSpec, run local checks, lint/type/build, and Playwright before
   archive.
5. Archive, commit with Conventional Commit, push, rebuild Docker preview, and
   smoke key public routes.

Rollback is a normal code revert: remove the model, UI panel, scripts, docs, and
spec/archive changes. No data migration is introduced.

## Open Questions

- Which production auth provider and invitation strategy should be selected?
  Deferred to the next auth/provider OpenSpec wave.
- Which domain/SSL and production hosting path should be used? Deferred to a
  deployment/provider OpenSpec wave.
- Which backup/restore target and retention policy should be accepted for real
  business data? Deferred to the data operations wave.
