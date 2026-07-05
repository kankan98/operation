## Why

Decision reasons, decision next actions, and action outcomes already have backend text limits, but the opportunity workspace form does not show those boundaries while the user is writing. Making the limits visible helps users keep manual workflow evidence saveable without relying on failed submissions as feedback.

## What Changes

- Show neutral length guidance for decision reason, decision next action, and action outcome fields in the selected opportunity detail form.
- Reuse the existing schema limits for the displayed limits and client-side save guards.
- Disable the relevant save action when a field exceeds its configured limit, while still requiring non-empty decision reasons and action outcomes.
- Keep the guidance scoped to manual workflow evidence quality; it must not add semantic validation, AI coaching, reminders, alerts, streaks, training grades, analytics, persistence, history, or scoring inputs.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `opportunity-research-workspace`: selected opportunity decision and action outcome forms now expose bounded text length guidance before saving workflow evidence.

## Impact

- Frontend opportunity workspace decision and action outcome form.
- Frontend opportunity workspace tests.
- Opportunity research workspace documentation and spec.
- Roadmap/current change state.
