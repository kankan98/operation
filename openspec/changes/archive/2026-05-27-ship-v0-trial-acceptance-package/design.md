## Context

The current V0 trial surfaces already prove most of the internal demo workflow:
six protected workbench list checks, guided trial run evidence, scoped feedback
evidence, AI review quality triage, and a production-gate list. What is missing
is a single acceptance package that a team lead can read in under a minute to
decide whether to expand internal trial use or fix a blocker first.

Source notes used before scoping:

- GOV.UK Service Manual beta guidance frames private beta as a limited rollout
  to get feedback and improve the service before wider access. It also calls out
  user research, performance data, whole-journey evidence, accessibility,
  security, safe deployment, and service availability as assessment concerns.
- NIST AI RMF describes AI risk management as part of designing, developing,
  using, and evaluating AI products; NIST's generative AI profile highlights
  that generative AI needs explicit risk actions aligned to project priorities.
- OWASP Top 10 for LLM Applications 2025 lists prompt injection, sensitive
  information disclosure, improper output handling, excessive agency, system
  prompt leakage, vector weaknesses, misinformation, and unbounded consumption
  risks. The V0 package must keep AI output human-reviewed and avoid raw
  secrets, prompts, transcripts, provider payloads, and cross-team data.
- W3C WCAG 2.2 includes focus visibility, labels or instructions, error
  identification, name/role/value, and status messages. The cockpit addition
  must preserve keyboard-visible, labelled, responsive controls and not depend
  on color alone.

Skill-backed value notes:

- Roadmap planning: the next coherent wave is a Now item that converts the
  existing V0 workstream from feature delivery into release evidence, while
  keeping production login, RAG, integrations, and observability in Next/Later.
- Prioritization: given early product stage, small team, limited real usage
  data, and a need to ship a usable V0, a value/effort and MoSCoW lens favors a
  compact acceptance package over new large capabilities.
- UI/UX search: use a restrained operational dashboard treatment, stable rows,
  clear comparison/status language, existing tokens, and concise evidence
  blocks. Discard the suggested marketing comparison-table pattern.
- Frontend design: keep the interface utilitarian and Chinese operator-facing;
  no hero treatment, decorative charts, or loud visual system changes.

## Goals / Non-Goals

**Goals:**

- Compute a deterministic acceptance package from existing readiness, feedback,
  and trial run evidence.
- Show the package inside both overview and `/trial` cockpit surfaces after the
  trial session is verified.
- Make the release decision explicit: collect more evidence, fix blockers,
  expand internal trial, or enter production-gate planning.
- Show evidence status for workflow completion, guided run completion, feedback
  coverage, and risk/blocker posture.
- Keep production readiness separate from internal V0 acceptance.

**Non-Goals:**

- No new database schema, repository, API route, migration, external analytics,
  provider SDK, AI call, RAG, source discovery, production login, team
  invitation, backup service, monitoring provider, or external integration.
- No replacement of the existing readiness stage logic.
- No claim that HTTP IP preview or internal V0 bootstrap is production-ready.
- No raw feedback note, transcript, prompt, cookie, provider payload, API key,
  database URL, or cross-team record in the acceptance package.

## Decisions

1. Add acceptance data to the existing cockpit builder.

   - Choice: extend `buildV0TrialReadinessCockpit` with an
     `acceptancePackage` object.
   - Rationale: all inputs and stage decisions already live there, so the
     package remains deterministic and testable without duplicating logic in
     React.
   - Alternative considered: create a separate route or server-side summary.
     Rejected because current evidence is already loaded client-side via scoped
     protected APIs and a new route would add surface area without improving V0
     value.

2. Map acceptance to the existing readiness stage instead of introducing a new
   release state machine.

   - Choice: derive four acceptance decisions from the existing stage plus
     workflow/run/feedback evidence.
   - Rationale: the accepted specs already distinguish collect-evidence,
     fix-blockers, internal trial readiness, and production gate preparation.
     A second state machine would increase disagreement risk.
   - Alternative considered: hard-code a percent complete. Rejected because
     percentages hide evidence quality and can be misleading for production
     gates.

3. Render the package as a compact evidence block in the existing cockpit.

   - Choice: one "V0 验收包" section with decision, four evidence lines, and
     blocker/gate copy.
   - Rationale: evaluators need a release judgment, not another long checklist.
   - Alternative considered: add a new top-level route. Rejected because it
     would split the evaluator's trial flow and slow the V0 closeout.

4. Keep production gates as blockers for production only.

   - Choice: internal V0 can pass acceptance while production gates remain open.
   - Rationale: this matches the product roadmap and prevents conflating
     internal trial with real sensitive-data production use.
   - Alternative considered: require production gates for V0 acceptance.
     Rejected because it would delay the stated goal of shipping a usable
     internal version first.

## Risks / Trade-offs

- Risk: evaluators read "accepted" as production-ready. Mitigation: labels and
  copy must explicitly say internal V0 and list production gates separately.
- Risk: a sparse feedback sample creates false confidence. Mitigation: fewer
  than three scoped feedback records keeps the decision in collect-evidence.
- Risk: a completed run with skipped/issue steps hides workflow friction.
  Mitigation: issue or skipped steps force fix-blockers and point to the
  workbench.
- Risk: cockpit grows visually dense. Mitigation: add one compact package block,
  reuse existing typography and badges, and verify desktop/mobile layout before
  archive.
- Risk: AI quality gets treated as a launch note instead of a blocker.
  Mitigation: AI-quality, source-trust, and downstream-workflow feedback remain
  blocker-focused and keep acceptance out of internal expansion.

## Migration Plan

1. Add test coverage to the deterministic cockpit check for all four acceptance
   decisions and evidence status lines.
2. Extend the cockpit builder types and logic.
3. Render the package in the existing internal and public trial cockpit panel.
4. Validate OpenSpec, run focused trial checks, lint, typecheck, build, and
   Playwright desktop/mobile before archive.
5. Archive, commit with a Conventional Commit prefix, push, rebuild Docker, run
   the preview container with `--restart unless-stopped`, and smoke-check the
   public URL.

Rollback is a code-level revert of the cockpit builder/UI changes. Because this
change adds no schema, provider, or route, rollback does not require data
migration.
