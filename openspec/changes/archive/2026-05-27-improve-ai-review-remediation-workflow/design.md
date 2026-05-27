## Context

`/trial` and the V0 acceptance package can now point AI-quality blockers to
`/ai-review`. The AI review workbench already has:

- protected run detail loading with tenant/team scope;
- evidence confidence summary;
- quality triage summary;
- section feedback for missing knowledge, wrong source, and weak evidence;
- accepted-section downstream draft creation for talk tracks and next actions.

The gap is operational clarity. The current quality triage explains what is
wrong, but it does not give evaluators a prioritized repair list that answers
"what do I fix first, which sections are affected, what remains blocked, and
what should I check after that?".

This is a stage 5 AI review MVP improvement. It uses existing safe run detail
and UI state. It does not introduce RAG, provider calls, queueing, production
auth, new persistence, or external source discovery.

## Goals / Non-Goals

**Goals:**

- Derive a deterministic remediation plan from existing `AiReviewRunDetail`,
  evidence confidence, quality triage, validation results, feedback signals,
  review state, confidence, source refs, and downstream eligibility.
- Render a compact "修复优先级" panel in `/ai-review` that shows ordered repair
  actions, affected section count, route label, downstream block state, and next
  verification cue.
- Keep repair guidance review-only and human-gated.
- Extend deterministic local verification so the plan is tested without live
  DeepSeek calls.
- Update specs, contract, and roadmap with this boundary for future production
  AI evaluation, source review UI, and feedback queues.

**Non-Goals:**

- No new API route, database table, migration, provider adapter, RAG snapshot,
  queue, object storage, analytics, or production auth.
- No automatic source trust changes, prompt edits, knowledge publication,
  talk-track publication, or task completion.
- No live DeepSeek smoke in default verification.
- No broad visual redesign of the AI review workbench.

## Decisions

1. **Use a derived helper, not stored remediation records.**
   - Decision: add typed remediation summary helpers in
     `apps/web/src/lib/ai-review-v0-workflow.ts`.
   - Rationale: remediation is a view of current protected run detail and should
     change as feedback, decisions, and validation state changes.
   - Alternative rejected: new table or route. It would add persistence and
     authorization surface before the V0 value is proven.

2. **Prioritize safety blockers before useful downstream actions.**
   - Decision: order remediation actions as validation blocker, missing
     knowledge, wrong source, evidence repair, human review, downstream draft,
     then evaluation sample.
   - Rationale: NIST and OWASP guidance both favor risk control, human oversight,
     and avoiding overreliance before reuse.
   - Alternative rejected: sort by section order only. That is easier but hides
     urgent trust and safety issues.

3. **Render actions as an operations panel, not a wizard.**
   - Decision: add a dense panel with cards/chips and concise Chinese labels.
   - Rationale: operators need quick scanning during trial evaluation. A wizard
     would add steps and state without removing the underlying review work.
   - Alternative rejected: modal or guided onboarding. It increases cognitive
     load and does not match this repeated workbench use.

4. **Keep links and mutations out of the first remediation wave.**
   - Decision: show route labels and next checks but do not auto-navigate or
     write records.
   - Rationale: the target routes for formal knowledge/source/prompt queues are
     not production-ready capability surfaces yet.
   - Alternative rejected: direct buttons to `/knowledge` or prompt review. That
     would imply workflow completion that does not exist.

## Risks / Trade-offs

- **Risk: Duplicate-looking guidance with quality triage.** → Mitigation:
  quality triage remains diagnostic; remediation plan is the ordered action
  queue and downstream block summary.
- **Risk: Operators may think remediation automatically fixes data.** →
  Mitigation: copy says feedback remains review-only and all publication/task
  completion stays human-gated.
- **Risk: Large `ai-review-v0-workflow.ts` grows further.** → Mitigation: keep
  helper typed and focused; if future waves add formal repair queues, split into
  a dedicated domain module under a new OpenSpec.
- **Risk: UI density on mobile.** → Mitigation: use existing `workbench-panel`,
  wrapping badges, stable min heights, and Playwright desktop/mobile checks
  before archive.

## Migration Plan

1. Add failing verifier assertions for remediation plan priority and redaction.
2. Implement derived helper and UI panel.
3. Update OpenSpec tasks, accepted contract/roadmap notes, and run verification.
4. Archive, commit, push, rebuild Docker preview, and smoke public routes.

Rollback is a code/docs revert of the helper, panel, and spec/docs changes. No
data migration or external state rollback is required.

## Open Questions

- Formal knowledge/source/prompt review queues remain future work and require
  separate OpenSpec changes once production auth and workflow ownership are
  clearer.
