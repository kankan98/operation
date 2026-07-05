## Context

The action outcome form derives completion criteria from the local selected `actionId`. The criteria update correctly when action type changes, but the criteria panel header does not identify the action type it currently describes.

## Goals / Non-Goals

**Goals:**

- Display the selected daily action label inside the completion criteria panel.
- Keep the criteria label synchronized with `actionId` for default, transient context, manual change, and saved latest outcome states.
- Preserve existing form behavior, validation, and save payloads.

**Non-Goals:**

- No backend, schema, OpenAPI, read-model, persistence, scoring, or dependency changes.
- No reminders, alerts, scheduled actions, stale filters, action history, analytics, AI coaching, or training grades.
- No redesign of the broader decision panel.

## Decisions

- Render the criteria action label from `dailyActionLabels[actionId]` next to the existing "完成定义" heading. This keeps the label tied to the same selected action source as criteria, prompts, and save payloads.
- Keep the existing `aria-label="行动结果完成定义"` on the criteria panel so current tests and assistive lookup behavior remain stable.

## Risks / Trade-offs

- The criteria panel gains one more short line of metadata. Keeping it muted and compact avoids competing with the criteria list itself.
- The label depends on the local selected action state; existing tests continue to verify that criteria, prompts, and save payloads follow the same state.
