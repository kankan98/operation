## Context

Candidate rows already show a neutral missing-outcome indicator when an active researched opportunity lacks latest daily action outcome evidence. The selected opportunity detail is where the user records that evidence, but its empty action outcome state is less explicit and does not mirror the row-level gap.

This is a frontend-only consistency change. The backend read model already exposes `research.lastActionOutcome` and `research.archived`; no persistence or API changes are needed.

## Goals / Non-Goals

**Goals:**

- Show an explicit `待补行动结果` indicator in selected opportunity detail for active researched opportunities without latest action outcome metadata.
- Keep saved latest action outcome detail display unchanged.
- Avoid showing the active gap for non-researched or archived candidates.

**Non-Goals:**

- Do not change backend schemas, database columns, API contracts, exports, or Chat tools.
- Do not add reminders, alerts, scheduled actions, streaks, analytics, AI coaching, training grades, task history, stale filters, or new persistence.
- Do not change opportunity score, confidence, recommendation, gates, market signals, business metrics, or factor contributions.

## Decisions

- Reuse the existing `research.lastActionOutcome` presence check. This keeps selected detail aligned with row summary semantics and avoids recomputing outcome state elsewhere.
- Gate the detail gap on an active research entry (`research` exists and is not archived). This mirrors the existing row behavior and avoids treating unresearched or archived candidates as active practice gaps.
- Keep the existing action outcome form and save blocker behavior unchanged. The label is a display-only scan aid, not validation or coaching.

## Risks / Trade-offs

- The label could duplicate the existing row gap when the same candidate is selected. Mitigation: the detail panel is the action surface, so the repeated cue is intentional and remains compact.
- Archived researched candidates could be confusing if labeled as missing practice evidence. Mitigation: archived candidates keep the neutral empty copy instead of the active gap label.
