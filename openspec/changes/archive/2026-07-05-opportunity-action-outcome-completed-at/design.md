## Context

The action outcome API already accepts an optional `completedAt` timestamp and persists it as the latest action completion time. The opportunity workspace UI currently records only the action id and outcome text, so saved outcomes default to the backend save time even when the work happened earlier.

This change is UI-focused and should keep the existing latest-outcome model. It must improve evidence accuracy without becoming action history, reminders, streaks, or coaching.

## Goals / Non-Goals

**Goals:**

- Let the user choose the completion date when saving the latest daily action outcome.
- Default new outcomes to today's local date.
- Initialize the date control from saved `lastActionOutcome.completedAt` when present.
- Submit `completedAt` through the existing action outcome request.

**Non-Goals:**

- No backend persistence changes or migrations.
- No full action history, reminders, streaks, habit analytics, training grades, or AI-generated coaching.
- No scoring, market signal, or business metric changes.
- No time-of-day picker; day-level completion evidence is enough for this workflow.

## Decisions

1. Use an HTML date input in the action outcome form.

   Rationale: the evidence needed is day-level. A date input is compact, familiar, and avoids overfitting to exact times that users are unlikely to know when backfilling review work. Alternative considered: `datetime-local`; it adds precision without operational value and creates more timezone edge cases.

2. Convert the selected local date to a millisecond timestamp at local start-of-day.

   Rationale: the backend stores milliseconds and existing UI formatting already accepts timestamps. Local date semantics match the user's manual review workflow. Alternative considered: sending the date string and changing backend schema; that would require a contract change where the existing timestamp field is already sufficient.

3. Preserve existing saved outcome data when action context changes.

   Rationale: transient workflow context must not overwrite saved evidence. The date input should follow the same saved-outcome-first precedence as action id and outcome text.

## Risks / Trade-offs

- [Risk] Local start-of-day timestamps can display as the previous/next date in a different timezone. -> Mitigation: this is a single-user local workflow; keep the UI and saved value consistent in the user's browser timezone.
- [Risk] Users may treat completion date as performance tracking. -> Mitigation: label the field as workflow evidence and keep caveats that outcomes do not affect scoring or become a training grade.
