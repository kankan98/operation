## Context

The daily action plan returns deterministic playbook guidance for each action id, including completion criteria. The opportunity workspace action outcome form already uses the same action ids, but it does not show those criteria while the user is writing the outcome evidence.

## Goals / Non-Goals

**Goals:**

- Show the selected daily action's completion criteria in the action outcome form.
- Keep the displayed criteria synchronized with the selected action id, including transient action context defaults.
- Keep the guidance visible for manual evidence quality without changing save validation beyond the existing bounded outcome/date checks.

**Non-Goals:**

- No backend API or database changes.
- No new action history, persistent task model, reminders, streaks, grades, AI coaching, scoring input, or analytics.
- No attempt to infer whether the user's outcome text satisfies the criteria.

## Decisions

1. Use a local frontend mapping keyed by `OpportunityResearchDailyActionId`.

   Rationale: the form must show criteria for any selectable action, including actions omitted from today's action plan because their count is zero. Alternative considered: derive criteria from `useOpportunityDailyActionPlan`; that would hide guidance for zero-count actions and couple form rendering to a summary query.

2. Keep criteria as display-only guidance.

   Rationale: the latest action outcome is manual workflow evidence. Enforcing text semantics would require subjective validation and would drift toward grading/coaching, which is out of scope.

3. Reuse the same fixed wording already used by the deterministic playbook.

   Rationale: users should see the same completion definition on the plan card and at the point of recording. This creates some duplication between backend and frontend strings, but avoids changing the API or persisting additional metadata.

## Risks / Trade-offs

- [Risk] The duplicated frontend criteria can drift from backend playbook text. -> Mitigation: add focused frontend tests for the displayed criteria and keep documentation clear that the mapping is deterministic workflow guidance.
- [Risk] Users may treat criteria as a grade. -> Mitigation: label them as completion criteria for practice evidence and preserve the existing non-scoring caveat near the save action.
