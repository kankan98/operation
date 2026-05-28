## Context

The V0 trial cockpit already combines protected workbench readiness, scoped
feedback evidence, six-step trial run evidence, and an acceptance package. That
is enough data to decide the next V0 action, but the current surface still
requires evaluators to read multiple panels before they know which evidence is
strong, which signal is weak, and whether the next step is a V0 fix or a V1
production gate.

This change belongs to the existing V0 trial/readiness layer. It does not move
the project into production auth, RAG, queue, analytics, or external
integration stages.

## Goals / Non-Goals

**Goals:**

- Derive a deterministic evidence review digest from existing cockpit inputs.
- Make complete-path evidence visibly stronger than loose feedback.
- Prioritize the next 1-3 review actions for a team lead or evaluator.
- Render the digest on both `/` and `/trial` where the existing cockpit appears.
- Keep the UI dense, Chinese, mobile-safe, and operational.
- Extend existing deterministic checks and browser verification coverage.

**Non-Goals:**

- No new table, migration, route, external analytics, questionnaire platform, AI
  call, production auth provider, or deployment target.
- No real customer data, private transcripts, orders, or platform integrations.
- No replacement of the existing feedback or trial-run capture panels.
- No production readiness claim; production login, HTTPS, backup, sensitive data,
  RAG/Q&A evaluation, and observability remain separate gates.

## Decisions

1. **Use a derived helper instead of persistence.**
   - Decision: extend `buildV0TrialReadinessCockpit` to return
     `evidenceReview`.
   - Rationale: all needed signals already exist in the client-safe cockpit
     state, and persisting a second derived summary would create stale state.
   - Alternative considered: create a new evidence-review API/table. Rejected
     because it adds data surface without new source evidence.

2. **Priority actions are deterministic and bounded.**
   - Decision: generate at most three review actions, ordered by blocker,
     missing path evidence, feedback quality, expansion, and production gate.
   - Rationale: the user asked for faster progress and fewer tiny proposals; a
     bounded list gives a useful decision surface without turning V0 into a
     project-management system.
   - Alternative considered: free-form AI summary. Rejected because this is an
     evidence and release decision surface, not a generation task.

3. **Complete-path evidence is first-class.**
   - Decision: expose a `completePathLabel` and `evidenceBalance` that explains
     whether feedback is linked to a guided completed run or mostly standalone.
   - Rationale: GOV.UK and NN/g research guidance favors observing realistic
     task completion, so broad V0/V1 decisions need to know whether feedback
     came from the actual six-step path.
   - Alternative considered: only show total feedback count. Rejected because it
     can make sparse or unlinked feedback look stronger than it is.

4. **UI follows existing cockpit patterns.**
   - Decision: add a compact section inside the existing readiness panel using
     `Badge`, `Button`, `Link`, existing card/border styles, and no new color
     tokens or dependencies.
   - Rationale: `ui-ux-pro-max` suggested high-status clarity and responsive
     safeguards; project rules prefer calm operational density over decorative
     dashboard visuals.
   - Alternative considered: new standalone route or chart-heavy dashboard.
     Rejected because the decision belongs directly beside the readiness and
     acceptance package.

## Risks / Trade-offs

- **Derived logic becomes hard to scan** -> keep helper functions typed and
  test each stage with deterministic fixtures.
- **UI duplicates acceptance package information** -> review digest focuses on
  action order and evidence strength; acceptance package remains release
  decision.
- **Feedback count may be interpreted as statistically representative** -> copy
  explicitly labels it as internal trial evidence and separates complete-path
  evidence from loose notes.
- **Mobile cards may become dense** -> use responsive grid/card layout, stable
  minimum heights, wrapping text, and Playwright mobile verification.
