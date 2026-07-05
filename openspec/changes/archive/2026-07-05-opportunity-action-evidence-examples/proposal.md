## Why

The action outcome form now explains what kind of evidence to write, but users still have to translate that guidance into a concrete record format. Showing action-specific evidence examples helps users practice consistent operational note-taking without introducing automated coaching or scoring.

## What Changes

- Show concise `证据样例` guidance for the selected action outcome type.
- Keep examples synchronized with manual action changes, transient daily-action/practice context, and saved latest outcome action type.
- Associate the action outcome textarea with both the prompt and visible examples as descriptive guidance.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `opportunity-research-workspace`: Action outcome evidence guidance includes action-specific visible examples for manual workflow evidence writing.

## Impact

- Affected code: `frontend/src/pages/Opportunities.tsx`, `frontend/tests/pages/Opportunities.test.tsx`
- Affected docs/specs: `openspec/specs/opportunity-research-workspace/spec.md`, opportunity research workspace development notes, roadmap
- No API, database schema, dependency, scoring, analytics, reminders, alerts, automation, semantic validation, AI coaching, or training-grade changes.
