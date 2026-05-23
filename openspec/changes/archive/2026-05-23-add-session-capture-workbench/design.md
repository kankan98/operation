## Context

The accepted product foundation says the MVP starts with manual session capture
before direct Douyin or commerce-platform integration. `/ai-review` now previews
how analysis will consume facts and knowledge, but `/sessions` still does not
show the source material operators will provide.

This change makes the capture contract visible without adding storage or AI
runtime behavior.

## Goals / Non-Goals

**Goals:**

- Replace the `/sessions` placeholder with a static operator-facing capture
  workbench.
- Preserve badminton racket and live-commerce domain language in the UI.
- Preview session facts, product order, explanation checkpoints, questions,
  objections, draft states, and downstream readiness.
- Use typed metadata in `src/lib` so future persistence can evolve from a clear
  field contract.
- Keep disabled controls and boundary labels clear so operators do not assume
  data is being saved.

**Non-Goals:**

- Do not add persistence, local draft autosave, API routes, database models,
  transcript upload, parsing, AI analysis, auth, analytics, platform integration,
  or new dependencies.
- Do not show real customer comments, order data, private messages, GMV,
  conversion data, pricing strategy, or full transcripts.
- Do not implement editable form state in this slice.

## Decisions

1. **Use static typed capture metadata in `src/lib`.**
   - Rationale: This defines field meaning without inventing persistence.
   - Alternative considered: Inline page content. Rejected because session
     capture will become a shared source for AI review, talk tracks, and tasks.

2. **Render a custom `SessionCaptureWorkbench`.**
   - Rationale: Manual capture is the first real MVP source workflow and needs
     more structure than the generic placeholder.
   - Alternative considered: A real form with client state. Deferred until
     draft save, validation, and recovery semantics are specified.

3. **Use disabled affordances for save/import/analyze actions.**
   - Rationale: Operators should understand the future workflow while the app
     remains truthful about not saving or analyzing data.

## Risks / Trade-offs

- Static fields may be mistaken for saved drafts -> Mitigation: boundary badges,
  disabled buttons, and copy state no saving exists.
- Page density on mobile -> Mitigation: responsive grids, compact rows, and
  browser checks for overflow.
- Future data model may differ -> Mitigation: metadata remains descriptive and
  avoids storage-specific fields.

## Migration Plan

1. Add typed session capture metadata.
2. Add `SessionCaptureWorkbench` using existing motion and UI primitives.
3. Update `/sessions` to render the custom workbench.
4. Update `apps/web/README.md` with the session capture boundary.
5. Run OpenSpec validation, lint, typecheck, build, browser checks, Docker
   build, and public preview verification.

Rollback: restore `/sessions` to `WorkflowPlaceholderPage routeId="sessions"`
and remove the added metadata/component files.

## Open Questions

- A later persistence change must decide validation rules, draft autosave,
  refresh recovery, tenant isolation, transcript upload limits, and how session
  records link to AI review runs.
