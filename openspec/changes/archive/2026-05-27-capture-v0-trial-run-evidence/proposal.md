## Why

The internal V0 now has a complete demo path and feedback form, but evaluators
still have to run the six workbenches informally and leave disconnected notes.
This makes it hard to prove whether V0.9 is ready for broader internal trial or
which workflow blocker should be fixed first.

This change turns each trial pass into scoped evidence: a guided run with step
status, friction notes, linked feedback, and a deterministic summary that can
drive the next V0/V1 prioritization wave without introducing production auth,
RAG, external analytics, or real customer data.

## Source Notes

- GOV.UK Service Manual, moderated usability testing
  (`https://www.gov.uk/service-manual/user-research/using-moderated-usability-testing`):
  checked practical guidance for observing users against tasks and recording
  problems during service evaluation. This supports capturing step-level trial
  tasks and observed friction rather than relying only on general ratings.
- Scrum Guide (`https://www.scrumguides.org/scrum-guide.html`): checked the
  idea that each increment should be usable. This supports keeping the next wave
  focused on proving a usable internal V0 path, not broad production scope.
- W3C PROV-O (`https://www.w3.org/TR/prov-o/`): checked provenance concepts for
  associating evidence with activities, agents, and entities. This supports a
  small evidence model that links run, evaluator, step, feedback, and generated
  artifacts without treating feedback as authoritative product truth.
- `ui-ux-pro-max` design-system and Next.js stack search: recommendations
  favored simple flat dashboard patterns, visible focus/loading states, and
  responsive controls. The high-level guidance is useful, but the color and
  typography suggestions are not copied because this project already has a
  restrained workspace design system.

## Skill-Backed Value Exploration

- `openspec-explore`: current accepted specs already cover V0 readiness and
  feedback summaries, but there is no first-class "trial run" entity. The
  smallest coherent wave is a run-evidence workflow, not another isolated
  feedback field or another AI generation feature.
- `roadmap-planning`: the roadmap is best treated as Now/Next/Later. The "Now"
  outcome is broader internal V0 trial confidence; production login, RAG, and
  external integrations remain "Next/Later" until V0 trial evidence is stronger.
- `prioritization-advisor`: current stage has limited usage data, so Value/Effort
  is more suitable than RICE. Run evidence is high value and moderate effort
  because it reuses existing session/auth, six workbench readiness checks, and
  trial feedback.
- `opportunity-solution-tree`: desired outcome is "prove the internal V0 path is
  usable enough to expand trial." The selected opportunity is that evaluators
  cannot submit complete path evidence. The selected solution is a guided trial
  run with step evidence and summary.
- `user-story-mapping`: evaluator journey should run left-to-right:
  start trial run -> inspect six workbenches -> mark each step outcome -> submit
  feedback -> review evidence summary -> choose next work.

## What Changes

- Add local-only V0 trial run evidence persistence for verified trial sessions:
  run summary, evaluator role, run status, started/completed timestamps, step
  status, step friction, and optional linked feedback.
- Add protected Route Handlers for creating/listing/updating trial runs and step
  evidence using existing app-owned session cookie, explicit tenant/team scope,
  no-store responses, CSRF for mutations, and safe JSON errors.
- Extend `/trial` and `/` trial cockpit with a compact "本次试用运行" panel:
  start/resume run, show six ordered steps, mark pass/issue/skipped, add concise
  friction notes, link to each workbench, and show run evidence summary.
- Extend existing V0 readiness logic so readiness can use complete run evidence
  in addition to scoped workbench counts and feedback evidence.
- Keep all data demo/internal-only and scoped to tenant/team/actor. Do not store
  raw transcripts, real customer/order/private-message data, provider payloads,
  cookies, session references, or API keys.
- No new external dependency, provider, analytics service, queue, object storage,
  RAG, production login, team invitation, or external platform integration.

## Capabilities

### New Capabilities

- `v0-trial-run-evidence`: local-only trial run evidence model, protected API,
  cockpit UI, and verification for evaluator run progress across the six V0
  workbenches.

### Modified Capabilities

- `v0-usable-trial-workflow`: readiness cockpit can incorporate complete trial
  run evidence, not only scoped list counts and feedback totals.
- `v0-trial-feedback`: feedback can be associated with a trial run/step so that
  evidence review distinguishes complete-path feedback from loose notes.

## Impact

- Database/schema: add local-only trial run and step evidence tables through
  Drizzle migration, scoped by tenant/team/actor.
- Server/domain: add repository and route handlers for run list/create/update
  and step evidence update.
- Frontend: update the existing internal trial cockpit component used by `/`
  and `/trial`.
- Verification: add focused repository/API/model checks, update affected trial
  readiness checks, run OpenSpec validation, lint, typecheck, build, and use
  Playwright before archive because rendered trial cockpit behavior changes.
