## Context

The accepted foundation specs define public seed knowledge, refresh, review,
source-backed AI grounding, and operator feedback as central product concepts.
The current app has a `/knowledge` route, but it still renders the generic
workflow placeholder.

This slice should make the North Star visible without pretending that ingestion,
persistence, or AI analysis already exist.

## Goals / Non-Goals

**Goals:**

- Replace the generic `/knowledge` placeholder with a knowledge learning hub.
- Show a small curated source registry using public professional sources already
  identified in the foundation.
- Preserve source type, trust level, refresh cadence, review state, and AI use
  intent in typed metadata.
- Visualize the lifecycle and feedback loop operators will rely on later.
- Keep the page Chinese, operational, motion-enabled, and token-consistent.

**Non-Goals:**

- Do not fetch websites automatically.
- Do not scrape restricted platforms.
- Do not persist records or add a database.
- Do not call AI providers.
- Do not use real customer comments, transcripts, sales metrics, prompts, or AI
  outputs.

## Decisions

1. **Use static typed metadata for public sources.**
   - Rationale: The project has no data layer yet. Static metadata lets the UI
     express the source registry contract without inventing persistence.
   - Alternative considered: JSON files under a seed folder. Deferred until the
     ingestion wave defines import/export and review workflows.

2. **Make `/knowledge` a custom page instead of generic placeholder content.**
   - Rationale: Knowledge and AI learning are now the product North Star, so the
     route deserves a richer operator-facing surface.

3. **Show links and metadata, not copied source content.**
   - Rationale: Avoid copyright and stale factual claims. The page should show
     public source metadata and intended fields, not reproduce long source text.

4. **Keep future automation explicit.**
   - Rationale: Operators must not assume the app is already fetching, reviewing,
     or grounding AI outputs. Badges and boundary copy must label this as a
     static planning surface.

## Risks / Trade-offs

- Static source entries can become stale -> Mitigation: show review and refresh
  cadence as planning metadata, not live status.
- Operators may think sources were already ingested -> Mitigation: page copy
  states no automatic fetch, persistence, or AI grounding exists yet.
- The page could become too dense on mobile -> Mitigation: use compact cards,
  wrapping metadata, and browser checks for overflow.

## Migration Plan

1. Add typed source registry and learning-loop metadata.
2. Add a `KnowledgeLearningHub` component for `/knowledge`.
3. Update `/knowledge/page.tsx` to use the custom hub.
4. Document the static source registry boundary.
5. Run OpenSpec validation, lint, typecheck, build, browser checks, and Docker
   build.

Rollback: restore `/knowledge` to `WorkflowPlaceholderPage routeId="knowledge"`
and remove the metadata/component files.

## Open Questions

- Which real ingestion format comes first: operator-provided URL, CSV/XLSX, or
  manually curated admin form. This remains for the future ingestion change.
