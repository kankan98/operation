## Why

The product North Star now requires continuous learning from professional public
sources, reviewed knowledge, and operator feedback. The current `/knowledge`
route is still a generic placeholder, so operators cannot see how source
registry, refresh, review, AI grounding, and feedback will connect.

## What Changes

- Upgrade `/knowledge` from a generic placeholder to a static knowledge learning
  hub that visualizes the future source registry and AI improvement loop.
- Add source-backed public seed entries for racket, sport-rule, platform, metric,
  and research knowledge with source type, trust level, refresh cadence, review
  state, and intended AI use.
- Show the lifecycle from source intake to normalization, review, published
  knowledge, AI grounding, operator feedback, and evaluation updates.
- Show AI feedback signals such as accepted suggestions, edited suggestions,
  rejections, regeneration reasons, and knowledge-refresh triggers.
- Keep all content static and non-sensitive; do not add persistence, automated
  fetching, external API calls, AI calls, auth, or new dependencies.

## Capabilities

### New Capabilities

- `knowledge-learning-hub`: Defines the operator-facing knowledge learning hub,
  static public source registry, source lifecycle visualization, and AI feedback
  loop surface for the current frontend-only stage.

### Modified Capabilities

- None.

## Impact

- Affected code: `apps/web/src/app/knowledge/page.tsx`,
  `apps/web/src/components/**`, and `apps/web/src/lib/**`.
- Affected docs: `apps/web/README.md`.
- APIs/dependencies: none.
- Data/security: only public source metadata and planning copy are displayed;
  no customer, transcript, pricing, prompt, or AI output data is used.
