## Why

The product route `/rackets` is still a generic placeholder, but racket product
knowledge is the common input for session capture, AI review, talk tracks, and
the future Q&A agent. Operators need a concrete product-library workbench shape
before persistence and AI grounding are added.

## What Changes

- Replace the `/rackets` placeholder with a static racket product library
  workbench that previews product records, specs, aliases, review states,
  source freshness, and downstream readiness.
- Add typed static product-library data under `apps/web/src/lib/` so the UI
  preserves badminton-specific fields without introducing persistence.
- Use the existing global theme tokens, `workbench-*` utilities, lucide icons,
  and motion primitives; do not add new dependencies.
- Document the route upgrade in `apps/web/README.md` and roadmap notes.
- Keep all actions disabled or clearly future-facing: no save, upload, search,
  AI call, scraping, import, database write, or external integration.

## Capabilities

### New Capabilities

- `racket-product-workbench`: Defines the static product-library workbench for
  racket models, specs, aliases, selling points, source/review states, and
  downstream AI/knowledge readiness.

### Modified Capabilities

- None.

## Impact

- Affected code: `apps/web/src/app/rackets/page.tsx`, new or updated workbench
  component and static data under `apps/web/src/components/` and `apps/web/src/lib/`.
- Affected docs: `apps/web/README.md`,
  `docs/roadmap/autonomous-development-roadmap.md`.
- APIs/dependencies: none.
- Data/security: no real business data, customer data, persistence, AI calls, or
  public-source collection.
