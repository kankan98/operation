## Context

The opportunity workspace practice summary includes `latestCompletedAt` and shows it in the practice coverage strip. Individual latest action outcomes now show neutral day-level recency labels, but the summary strip still requires parsing an absolute timestamp.

## Goals / Non-Goals

**Goals:**

- Reuse the frontend day-level recency formatter for practice summary latest completion.
- Show the recency label as the primary summary value when `latestCompletedAt` exists.
- Keep the absolute completion time visible as secondary detail.

**Non-Goals:**

- No backend, database, schema, API, or export changes.
- No stale thresholds, filters, alerts, reminders, streaks, grades, AI coaching, analytics, or scoring input.
- No changes to practice summary counts or action bucket behavior.

## Decisions

1. Use the existing frontend recency formatter.

   Rationale: the summary and individual outcome displays should speak the same day-level language. Alternative considered: keep absolute time only, but that is harder to scan in the summary strip.

2. Keep the label neutral and unstyled as a warning.

   Rationale: this is a display cue, not an operational rule. Older labels should not imply stale status or trigger a workflow.

## Risks / Trade-offs

- [Risk] Users may read old recency labels as an implicit stale threshold. -> Mitigation: keep neutral visual treatment and do not add filters or alerts.
- [Risk] Client timezone can affect day labels. -> Mitigation: this is a frontend-only scan cue; stored timestamps and server validation remain authoritative.
