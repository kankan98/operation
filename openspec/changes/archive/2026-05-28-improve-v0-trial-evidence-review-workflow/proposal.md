## Why

Internal V0 is almost usable, but the current trial cockpit still makes a team
lead mentally combine workflow readiness, trial-run steps, feedback hotspots,
and production-gate status before deciding what to do next. This slows V0
freeze decisions and risks starting V1 work before the most important trial
evidence is understood.

## What Changes

- Add a deterministic V0 trial evidence review capability that turns existing
  workflow readiness, six-step run evidence, feedback summary, and acceptance
  status into a compact review digest.
- Show prioritized review actions for team leads and evaluators: fix a blocker,
  complete missing path evidence, collect more feedback, expand internal trial,
  or start production-gate planning.
- Distinguish complete-path evidence from loose feedback so broad V0/V1
  prioritization is not based on unlinked or partial signals.
- Render the review digest inside the existing `/trial` and `/` trial cockpit
  without adding a new database table, external analytics, AI call, auth
  provider, or production deployment target.
- Update roadmap and verification checks so V0 acceleration is measured by
  evidence quality and next-action clarity, not by adding more isolated panels.

## Research And Skill Gate

- GOV.UK Service Manual, "Using moderated usability testing", is credible as a
  public-service user-research guide. It supports this scope because moderated
  usability testing should use clear tasks, observe whether people complete
  relevant tasks, identify language/layout issues, and maintain consistent
  records. This informed the review digest requirement to separate full
  six-step run evidence from standalone feedback.
- Nielsen Norman Group, "Turn User Goals into Task Scenarios for Usability
  Testing", is credible as a professional UX research source. It emphasizes
  realistic, actionable task scenarios and task completion as a usability
  signal. This informed the choice to prioritize evidence from the actual V0
  path rather than only opinion notes.
- W3C WCAG 2.2 Reflow and Status Messages are credible standards-body sources.
  They keep the UI scope constrained to mobile-safe cards, no incoherent
  horizontal overflow, and status updates that are visible without forcing
  focus.
- `openspec-explore`, `opportunity-solution-tree`, `user-story-mapping`,
  `prioritization-advisor`, `ui-ux-pro-max`, and `frontend-design` were used as
  the value/UX gate. Durable conclusion: the target user is the team lead or
  evaluator trying to decide whether V0 can freeze; the core friction is not
  data entry but evidence synthesis; the restrained product highlight is a
  priority-ranked review digest that saves scanning time without changing the
  underlying trial workflow.

## Capabilities

### New Capabilities

- `v0-trial-evidence-review`: Derives and renders a scoped V0 trial evidence
  review digest from existing readiness, feedback, run, and acceptance signals.

### Modified Capabilities

- `v0-usable-trial-workflow`: The trial cockpit must include the review digest
  as part of its V0.9 readiness surface.

## Impact

- Affected code: `apps/web/src/lib/v0-trial-readiness-cockpit.ts`,
  `apps/web/src/lib/v0-trial-readiness-cockpit-check.ts`, and
  `apps/web/src/components/internal-trial-access.tsx`.
- Affected docs: AI continuous development goal and autonomous roadmap V0
  completion notes.
- Affected specs: new `v0-trial-evidence-review` and delta for
  `v0-usable-trial-workflow`.
- No new dependencies, database tables, provider SDKs, AI calls, auth provider,
  queue, analytics, external integration, or production deployment provider.
