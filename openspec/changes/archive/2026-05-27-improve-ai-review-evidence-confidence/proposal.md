## Why

Recent V0 trial feedback points to AI review quality and trust as the next
blocker: operators can generate review suggestions, but they cannot quickly tell
which sections are evidence-backed, weak, or safe to carry into talk tracks and
next-session tasks. This matters now because the internal V0 is close to usable,
and the fastest way to make it credible is to improve operator confidence in
existing AI review outputs without adding new providers, RAG, or persistence.

## Source Notes

- NIST AI RMF 1.0, official NIST PDF (`https://nvlpubs.nist.gov/nistpubs/ai/NIST.AI.100-1.pdf`):
  checked trustworthy AI risk framing and the Govern / Map / Measure / Manage
  functions. This supports surfacing measured validation, evidence, and human
  review status rather than hiding AI risk behind a single generated result.
- OWASP Top 10 for LLM Applications 2025, LLM09 Misinformation
  (`https://genai.owasp.org/llmrisk/llm092025-misinformation/`): checked
  hallucination, overreliance, cross-verification, human oversight, risk
  communication, and UI labeling guidance. This changes scope toward visible
  source coverage, uncertainty, and review guidance before operators reuse AI
  suggestions.
- OWASP Top 10 for LLM Applications 2025, LLM05 Improper Output Handling
  (`https://genai.owasp.org/llmrisk/llm052025-improper-output-handling/`):
  checked output validation and downstream handling risk. This reinforces that
  downstream draft actions must remain gated by accepted review state and visible
  validation status.
- `ui-ux-pro-max` design-system and Next.js/UX searches: the generated
  high-energy webinar styling is not appropriate for this operational tool, so
  this change keeps the existing dense dashboard system. The useful guidance is
  to preserve clear loading, success, error, focus, and validation states.

## Skill-Backed Value Exploration

- `openspec-explore`: existing code already stores `overallConfidence`,
  `sourceRefs`, `validationResults`, and `feedbackSignals`, so the smallest
  coherent wave is a workflow-level evidence and confidence cockpit, not a new
  schema or provider integration.
- `opportunity-solution-tree`: target outcome is higher internal V0 trial
  confidence. The selected opportunity is that operators cannot judge whether AI
  review sections are evidence-backed enough for real work. The best POC is a
  run-level and section-level trust view that turns existing signals into
  review actions.
- `prioritization-advisor`: current product stage is internal V0 with limited
  usage data, so use value/effort plus confidence rather than heavyweight RICE.
  This ranks AI review trust above new integrations because it addresses the
  current feedback hotspot with existing data.
- `ui-ux-pro-max` / frontend design review: keep the page calm, dense, Chinese,
  and operator-facing. The restrained product highlight should be faster trust
  judgment, not a decorative redesign.

## What Changes

- Add a selected-run evidence confidence cockpit to `/ai-review` that summarizes
  overall confidence, source coverage, validation warnings, review progress,
  feedback hotspots, and the next review action.
- Add section-level evidence guidance to generated AI review cards so operators
  can see source count, confidence label, validation impact, feedback issues,
  and whether the section is ready for downstream use.
- Keep all signals derived from existing run detail fields: input snapshot,
  knowledge snapshot, output confidence, section source refs, validation
  results, decisions, and feedback signals.
- Preserve existing protected API, auth scope, CSRF, no-store, local V0 fake
  provider, and gated live-model behavior. No new database table, provider,
  RAG, queue, external analytics, or dependency is introduced.
- Update roadmap/spec wording where this wave changes V0 readiness and fix
  stale TBD purposes in touched AI review specs.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `ai-review-workbench`: add run-level and section-level evidence confidence
  requirements for `/ai-review`.
- `operator-v0-ai-review-workflow`: require the V0 browser workflow to expose
  evidence confidence before review and downstream reuse.
- `ai-review-feedback-learning-loop`: clarify that feedback signals contribute
  to visible trust and review routing without changing authoritative knowledge.

## Impact

- Frontend: `apps/web/src/components/ai-review-workbench.tsx`.
- Shared browser/domain helpers: `apps/web/src/lib/ai-review-v0-workflow.ts`.
- Verification scripts: likely `apps/web/src/server/ai-review/operator-v0-check.ts`
  and existing route/check scripts if the helper behavior is covered outside the
  browser.
- Specs and docs: delta specs under this change, AI review spec purpose cleanup,
  and roadmap/goal updates after implementation evidence is known.
- Verification: `openspec validate`, focused AI review checks, `pnpm lint`,
  `pnpm typecheck`, `pnpm build`, and Playwright desktop/mobile verification
  before archive because `/ai-review` rendered behavior changes.
