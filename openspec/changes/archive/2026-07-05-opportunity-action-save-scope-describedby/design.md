## Context

The selected opportunity action outcome form already renders a static save-scope note near the save controls and conditionally renders a local save-readiness hint when the action outcome cannot be saved. The save button currently has its own label, but it does not reference either visible note.

## Goals / Non-Goals

**Goals:**

- Give the save-scope note a stable id.
- Give the conditional save-readiness hint a stable id.
- Set the action outcome save button `aria-describedby` to the save-scope note, and append the save-readiness hint id when that hint is visible.
- Keep all existing text, disabled logic, mutation payloads, and saved action outcome behavior unchanged.

**Non-Goals:**

- No backend, schema, OpenAPI, persistence, scoring, analytics, reminders, alerts, AI coaching, training grades, or automation changes.
- No new validation rules or semantic interpretation of action outcome text.
- No redesign of the action outcome controls.

## Decisions

- Use stable static ids because the page renders a single selected-opportunity action outcome form at a time.
- Reference the visible notes directly from `aria-describedby` instead of adding hidden duplicate text, preventing copy drift.
- Keep the save-readiness hint conditional. Enabled saves reference only the save-scope note; disabled saves also reference the current local reason.

## Risks / Trade-offs

- Duplicate id risk if multiple selected detail panels render simultaneously -> mitigated by the existing single selected detail panel structure.
- Disabled button description support varies by assistive technology -> mitigated by keeping the visible hint and `aria-live` behavior unchanged while adding the standard descriptive relationship.
