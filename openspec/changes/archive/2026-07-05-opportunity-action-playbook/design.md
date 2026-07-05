## Context

The opportunity workspace now provides a daily action plan that applies review filters. The next gap is capability building: the user still needs to know what to do after opening a queue. For a personal manual-first research assistant, deterministic playbook guidance is enough and safer than AI-generated coaching.

## Goals / Non-Goals

**Goals:**

- Add bounded playbook guidance to each daily action item.
- Make guidance practical: one learning goal, short execution steps, and completion criteria.
- Render guidance in the existing daily action plan panel without creating a separate training dashboard.
- Preserve the current filter-driven action flow.

**Non-Goals:**

- Adding persistent task completion state, habit analytics, or historical training records.
- Adding AI-generated coaching or prompt-driven guidance.
- Adding a content management system for playbooks.
- Changing opportunity score, recommendation, confidence, gates, market signals, business metrics, or factor contributions.

## Decisions

### Attach guidance by action id

Each known action id will map to a deterministic playbook:

- `add_next_action`: define the next concrete follow-up.
- `review_stale_decisions`: re-check whether the decision still matches current evidence.
- `decide_candidates`: convert an undecided candidate into go/hold/no-go.
- `continue_research`: collect the missing evidence that would unblock a decision.

Alternative considered: store playbooks in the database. That adds editing and migration overhead before there is evidence the guidance needs to be user-configurable.

### Keep guidance fields explicit

The API will add `learningGoal`, `steps`, and `completionCriteria` to each action item. Arrays will be bounded in tests and UI copy, so cards remain scannable.

Alternative considered: one markdown body per action. Structured fields are easier to test, easier to render accessibly, and less likely to mix instructional text with score evidence.

### Render guidance inside existing action cards

The UI will keep one daily action panel. Each card can show the learning goal, ordered steps, and completion criteria while retaining the click action that applies filters.

Alternative considered: open a modal for playbook details. The guidance is short enough to show inline; a modal would slow the daily review flow.

## Risks / Trade-offs

- Guidance can make cards dense -> Use short labels, tight spacing, and bounded lists.
- Users may mistake guidance for automated business advice -> Keep caveats and labels scoped to workflow practice, not sales or score evidence.
- Static guidance may become too generic -> Start deterministic; future changes can add user-configurable playbooks after observing real use.
