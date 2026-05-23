## Why

The product North Star requires AI analysis that improves through source-backed
knowledge and operator feedback, but `/ai-review` is still a generic
placeholder. Operators need to see the intended review workflow before real AI
calls, persistence, or provider infrastructure are introduced.

## What Changes

- Upgrade `/ai-review` from a generic placeholder to a static AI review
  workbench for badminton racket live-commerce sessions.
- Show the future flow from operator-entered session facts to reviewed
  knowledge grounding, structured AI output validation, human review, and
  downstream operational artifacts.
- Add typed static metadata for review inputs, evidence sources, analysis
  sections, validation states, feedback signals, and failure/empty states.
- Add the future governed Q&A agent learning route to the development roadmap:
  user questions, thumbs feedback, web-assisted answer discovery, reviewed
  knowledge updates, and continuous answer-quality improvement.
- Clearly label boundaries: no AI provider call, prompt execution, persistence,
  review queue, task creation, or external data fetch exists in this slice.
- Keep the interface Chinese, motion-enabled, token-consistent, dense, and
  suitable for repeated operator work.

## Capabilities

### New Capabilities

- `ai-review-workbench`: Defines the operator-facing static AI review workbench,
  including source/fact separation, structured output preview, human feedback
  signals, and visible frontend-only boundaries.

### Modified Capabilities

- `product-strategy-foundation`: Adds the future Q&A agent learning route as a
  governed roadmap capability that must be implemented through later OpenSpec
  changes before any AI provider, web search, or knowledge persistence is added.

## Impact

- Affected code: `apps/web/src/app/ai-review/page.tsx`,
  `apps/web/src/components/**`, and `apps/web/src/lib/**`.
- Affected docs: `apps/web/README.md`.
- APIs/dependencies: none.
- Data/security: only static sample metadata is displayed; no real customer
  comments, transcripts, pricing strategy, prompts, model outputs, or business
  metrics are used. The future Q&A agent route is documented only and does not
  add runtime behavior in this change.
