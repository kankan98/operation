## Context

Daily action items and practice bucket filters can now route the user to the right candidate set. The remaining friction is that the action outcome form still defaults to a generic action id unless the entry already has an outcome, so the user can easily record evidence against the wrong action.

The implementation should stay manual-first and lightweight: action context is navigation state, not a new persisted task, reminder, habit, or scoring signal.

## Goals / Non-Goals

**Goals:**

- Carry the selected daily action id from action plan and practice bucket controls into the selected opportunity panel.
- Prefill the action outcome action id with that context when no latest outcome exists.
- Show the active workflow action context near the outcome form.
- Preserve existing explicit user control: the user can still change the action id before saving.

**Non-Goals:**

- Adding backend fields, migrations, or action history.
- Automatically saving action outcomes.
- Adding reminders, due dates, streaks, training grades, or AI coaching.
- Changing score, recommendation, confidence, market signals, business metrics, or factor contributions.

## Decisions

### Use transient frontend state

The workspace will keep `activeActionContext` in component state. Selecting a daily action item sets it from the item id. Selecting a practice action bucket sets it from that bucket id. Clearing practice filters clears the context only when it came from the practice filter.

Alternative considered: persist the active action context per user. That would introduce lifecycle questions and resembles task state before there is a clear need.

### Prefer existing outcome over context

If the selected research entry already has a latest action outcome, the form should continue showing that saved action id and outcome text. Context should prefill only when the form is otherwise empty.

Alternative considered: always overwrite the form when context changes. That could accidentally hide existing evidence and make editing less predictable.

## Risks / Trade-offs

- Context may be stale after several filter changes -> show the label clearly and allow manual action id changes.
- A daily action can route to entries that later no longer match -> context remains a form aid only and does not change persisted state until save.
- More UI labels can add clutter -> keep the context label compact and colocated with the outcome form.

## Migration Plan

- No database migration is required.
- Rollback removes the transient state and context label; saved action outcomes remain unchanged.

## Open Questions

- None for this slice.
