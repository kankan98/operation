## Why

AI review, Q&A agent learning, talk-track improvement, and next-session tasks
all depend on clean live-session source material. The `/sessions` route is still
a generic placeholder, so operators cannot see what manual session capture will
collect before persistence and AI analysis are introduced.

## What Changes

- Upgrade `/sessions` from a generic placeholder to a static live-session
  capture workbench.
- Show the future manual capture structure for session theme, host, date,
  product order, racket-specific explanation checkpoints, customer questions,
  objections, performance notes, and next-session signals.
- Add typed static metadata for session fields, product-order rows, question and
  objection capture, draft/recovery states, and downstream readiness checks.
- Clearly label boundaries: no persistence, draft autosave, upload, transcript
  parsing, AI analysis, auth, or platform integration exists in this slice.
- Keep the interface Chinese, dense, token-consistent, motion-enabled, and
  suitable for repeated operator work.

## Capabilities

### New Capabilities

- `session-capture-workbench`: Defines the frontend-only manual live-session
  capture workbench, including static source-material fields, product-order
  capture, question/objection capture, draft state previews, and boundaries for
  future persistence and AI analysis.

### Modified Capabilities

- None.

## Impact

- Affected code: `apps/web/src/app/sessions/page.tsx`,
  `apps/web/src/components/**`, and `apps/web/src/lib/**`.
- Affected docs: `apps/web/README.md`.
- APIs/dependencies: none.
- Data/security: only static sample metadata is displayed; no real transcripts,
  customer comments, orders, GMV, conversion data, pricing strategy, or private
  messages are used.
