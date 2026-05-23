## Context

The accepted foundation specs define AI-assisted session analysis as a core
workflow, but the app has no backend, database, AI provider, prompt runner, or
review queue. The current `/ai-review` page is a placeholder, while `/knowledge`
now shows the source lifecycle that future AI grounding will depend on.

This slice makes the AI review workflow inspectable without crossing undefined
architecture boundaries. The page can show static sample metadata, states, and
workflow contracts, but it must not imply that real AI analysis has run.

## Goals / Non-Goals

**Goals:**

- Replace the `/ai-review` placeholder with a static operator-facing workbench.
- Show the future analysis loop: operator facts, knowledge grounding,
  validation, AI suggestion review, feedback capture, and downstream artifacts.
- Use typed metadata for all sample sections so future implementation can evolve
  toward schemas instead of unstructured copy.
- Preserve visible distinction between human facts, source-backed knowledge, and
  AI inferences.
- Keep the UI Chinese, dense, modern, token-driven, responsive, and motion-enabled
  through existing motion primitives.
- Capture the future Q&A agent learning route in product documentation and specs
  without implementing agent runtime behavior in this slice.

**Non-Goals:**

- Do not add AI provider calls, prompt templates, API routes, persistence, auth,
  background jobs, task creation, scraping, analytics, or new dependencies.
- Do not display real customer comments, transcripts, GMV, pricing strategy,
  private prompts, or model outputs.
- Do not make disabled review controls mutate state or simulate successful
  generation.
- Do not implement the future Q&A agent, web search, thumbs feedback storage, or
  automatic knowledge-base update loop in this change.

## Decisions

1. **Use static typed review metadata in `src/lib`.**
   - Rationale: The app has no data layer yet. Typed metadata gives the UI a
     clear contract for future analysis sections, validation states, evidence,
     and feedback signals.
   - Alternative considered: Inline arrays in the component. Rejected because the
     future AI workflow needs stable domain types and the component would become
     harder to review.

2. **Render a custom `AiReviewWorkbench` instead of extending the generic
   placeholder.**
   - Rationale: AI review is a primary product workflow and needs a richer layout
     than readiness cards.
   - Alternative considered: Add more copy to the placeholder. Rejected because
     it would not show the analysis loop, evidence separation, or operator
     feedback model.

3. **Show preview controls as disabled or boundary-labeled affordances.**
   - Rationale: Operators need to understand future accept/edit/reject/regenerate
     actions, but active controls would falsely imply persistence or AI execution.
   - Alternative considered: Local client state for demo interactions. Deferred
     until a later change defines draft state, review records, and save behavior.

4. **Reuse existing motion and theme primitives.**
   - Rationale: The workspace already has global motion tokens and a token-based
     theme. No additional animation or UI dependency is needed for this slice.
   - Alternative considered: Add a tab or chart dependency. Rejected because the
     layout can be expressed with existing React, Tailwind, shadcn-compatible
     primitives, lucide icons, and `motion`.

5. **Document the future Q&A agent as a governed roadmap capability.**
   - Rationale: The user wants a later agent that answers questions, uses
     thumbs feedback, searches the web when knowledge is insufficient, and feeds
     reviewed findings back into the knowledge base. This crosses AI provider,
     search, persistence, review, and safety boundaries, so it belongs in the
     accepted roadmap before implementation details are chosen.
   - Alternative considered: Add a live chat placeholder now. Rejected because
     it would invite hidden assumptions about provider choice, search source
     policy, feedback storage, and knowledge authority.

## Risks / Trade-offs

- Static examples may be mistaken for real AI results -> Mitigation: use explicit
  labels, boundary panels, and disabled actions stating that no AI call or save
  occurs.
- The page can become too dense on mobile -> Mitigation: use responsive grids,
  compact panels, stable card dimensions, and desktop/mobile browser checks.
- Future AI schemas may differ from this preview -> Mitigation: keep metadata
  descriptive and avoid locking in prompt/provider implementation details.
- Showing feedback signals without persistence may feel incomplete -> Mitigation:
  frame them as future auditable inputs, not live analytics.

## Migration Plan

1. Add typed static AI review metadata.
2. Add `AiReviewWorkbench` using existing workspace motion primitives and UI
   tokens.
3. Update `/ai-review` to render the custom workbench.
4. Document the frontend-only AI review boundary and future Q&A agent learning
   route in `apps/web/README.md`.
5. Run OpenSpec validation, lint, typecheck, production build, browser checks,
   Docker build, and public container verification.

Rollback: restore `/ai-review` to `WorkflowPlaceholderPage routeId="ai-review"`
and remove the added metadata/component files.

## Open Questions

- The first real AI implementation still needs a later change to decide prompt
  versioning, output schema validation, provider fallback, audit metadata, and
  persistence boundaries.
- The future Q&A agent needs later OpenSpec decisions for official web-search
  policy, source trust ranking, answer citation rules, feedback schema,
  knowledge review workflow, tenant isolation, abuse prevention, and evaluation
  metrics.
