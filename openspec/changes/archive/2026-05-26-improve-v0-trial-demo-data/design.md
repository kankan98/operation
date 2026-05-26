## Context

The project has a working internal V0 trial entry, scoped protected APIs, local
PostgreSQL persistence, six operator workbenches, local V0 AI review, downstream
talk-track/task workflows, and feedback evidence review. The remaining V0 gap is
not another major provider or architecture decision; it is time-to-value for
evaluators. A first-time user entering `/trial` should be able to inspect a
complete, realistic, safe operator story before deciding whether the product is
useful.

This change stays inside the accepted local runtime architecture:
Next.js Route Handlers, app-owned session cookie, explicit tenant/team scope,
PostgreSQL/Drizzle, existing repository layers, Zod validation, local fake AI
provider, and no-store safe JSON responses.

## Goals / Non-Goals

**Goals:**

- Seed or reuse a deterministic, demo-only V0 scenario for the existing internal
  trial tenant/team.
- Represent the full operator path with domain-specific badminton racket
  language: session theme, racket model/specs, source evidence, AI review,
  talk-track draft, and next-session task.
- Preserve idempotency: entering trial repeatedly should refresh the session but
  should not create duplicate demo business records.
- Make the loaded sample obvious in `/trial` and `/` through concise operator
  copy and existing workspace UI patterns.
- Verify the sample path through local checks and browser checks before archive.

**Non-Goals:**

- No production authentication provider, invite flow, team switching, HTTPS
  policy, backup/restore, or real sensitive-data entry.
- No RAG, Q&A runtime, public source discovery, external analytics, queue,
  object storage, or provider deployment decision.
- No real DeepSeek/live model call. AI review sample output remains local fake
  provider or pre-recorded local V0 output with human-review state.
- No schema migration unless existing tables prove insufficient during
  implementation.
- No marketing tour, hero page, decorative charting, or broad redesign.

## Decisions

1. **Seed through a trial demo service called from the V0 bootstrap path.**

   The bootstrap route is already the one place that deterministically creates
   the internal V0 tenant/team/operator and issues a short-lived trial session.
   Adding a server-only `ensureV0TrialDemoData` helper after ownership records
   exist keeps sample data tied to the same scope and makes public preview
   entry self-contained. Alternative: add a separate "Load sample data" route.
   Rejected for V0 speed because it adds another action before evaluators see
   value and shares the same auth/scope boundary.

2. **Use existing repositories where possible; fall back to scoped direct
   Drizzle only when a missing repository API would otherwise force a broad
   refactor.**

   Repository calls preserve validation, state transitions, and scope. Some
   idempotency detection may require direct scoped reads against existing tables
   because repository create methods intentionally generate random record IDs.
   Any direct query must stay inside the server-only demo seed helper, use
   deterministic V0 tenant/team predicates, and not bypass user-facing business
   validation for persisted sample content.

3. **Treat sample records as demo artifacts, not authoritative production
   facts.**

   Product and knowledge records can be reviewed/published only inside the
   demo tenant/team. AI review output remains local V0 output with source refs
   and review state. UI copy should say "演示样例" and "脱敏数据", not "生产数据"
   or "真实客户数据".

4. **Make idempotency count-based and fingerprint-based.**

   The seed helper should check for existing scoped demo records by stable
   identifiers such as normalized title/model/source key, source workflow, or
   scenario fingerprint before creating them. If a user has edited or added
   their own records, the helper should not delete or reset that work.

5. **Keep UI guidance compact and operational.**

   The trial cockpit should show what scenario is already available and a
   suggested path to inspect it. It should not explain OpenSpec, implementation
   boundaries, database plans, or future architecture. Long safety text belongs
   in docs; UI uses short reminders like "仅使用演示/脱敏数据".

## Risks / Trade-offs

- **Bootstrap does more work and could be slower** -> Keep the seed set to one
  scenario, reuse existing records, and verify route latency only through local
  checks for now.
- **Demo data might hide empty-state usability** -> Existing workbench empty
  states remain in code and checks; the trial path prioritizes first-run value.
  Future checks can still create isolated empty tenants when needed.
- **Direct seed queries could bypass domain rules** -> Prefer repositories and
  record any direct insert/read in the helper. Keep direct use scoped,
  deterministic, and covered by a local check.
- **Repeated entry could duplicate records** -> Add an explicit idempotency
  verifier that calls bootstrap twice and checks counts do not grow.
- **Sample copy could look like real business truth** -> Label records as V0
  demo/de-identified in titles, source metadata, and trial cockpit guidance.

## Migration Plan

1. Create a server-only trial demo seed module with deterministic sample inputs,
   scoped existence checks, and an exported `ensureV0TrialDemoData` function.
2. Call the seed helper from `handleOperatorV0SessionRoute` after ownership
   records are ensured and before returning the success body.
3. Add or extend a local check to bootstrap twice, list all six workbench
   surfaces, assert non-zero counts, assert idempotency, assert safe redaction,
   and assert feedback route compatibility.
4. Update `/trial` and `/` cockpit copy/components to surface the loaded demo
   scenario and suggested evaluator path.
5. Update roadmap/goal docs with the new V0 completion state and remaining
   risks.
6. Run OpenSpec validation, local checks, lint/typecheck/build, and Playwright
   before archive. After archive, commit, push, Docker redeploy, and public
   smoke as required.

Rollback: remove the bootstrap seed call and demo UI copy. Existing demo rows
can remain in local preview data because they are scoped to the deterministic
V0 tenant/team and contain no sensitive business data.

## Open Questions

None for this wave. Real product facts, price bands, supplier details, customer
conversation examples, and production AI quality thresholds require user
business input and are intentionally not introduced here.
