## Context

The selected opportunity action outcome form already derives `actionId` from saved latest outcomes, transient workflow context, or the default `continue_research` action. Completion criteria, evidence prompts, and save payloads follow this local `actionId`, but users only see the selected action inside the select control unless a transient context chip is present.

## Goals / Non-Goals

**Goals:**

- Show the current selected action type as a compact summary near the action outcome guidance.
- Keep the summary synchronized with the local `actionId` as users change the select control.
- Preserve saved latest action outcome priority and existing transient context chip behavior.

**Non-Goals:**

- No backend, schema, OpenAPI, persistence, scoring, read-model, or dependency changes.
- No reminders, alerts, scheduled work, stale filters, action history, analytics, AI coaching, or training grades.
- No redesign of the action outcome form layout beyond a small neutral summary line.

## Decisions

- Render the summary from the existing `dailyActionLabels[actionId]` in `DecisionPanel`. This uses the same source of truth as completion criteria, prompts, and save payloads.
- Hide the summary when a saved latest action outcome is displayed. Saved outcomes already show their saved action label and should remain the priority state.
- Keep the transient context chip intact. When context exists, it explains where the preselection came from; the new summary explains the current action type that the form will save.

## Risks / Trade-offs

- The form gains another small piece of text. Keeping it compact and neutral avoids competing with completion criteria or blocker hints.
- The summary is only as accurate as the local selected `actionId`; existing tests should also continue verifying save payloads follow that selected action.
