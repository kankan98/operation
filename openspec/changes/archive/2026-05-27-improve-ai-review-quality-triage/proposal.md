## Why

Internal V0.9 already lets an operator generate and review AI recap suggestions, but "quality is not good enough" is still too vague to drive the next repair step. Operators need a compact way to see which suggestion is blocked by missing knowledge, weak evidence, source risk, validation warnings, or lack of human review before they send it to talk tracks or next-session tasks.

This change is needed now because the current trial cockpit is close to usable, and the next bottleneck is trust in AI review output rather than another isolated API or provider integration. Reliable source checks support this direction: NIST AI RMF and the NIST GenAI profile emphasize traceability, measurement, and human oversight for AI risk; OWASP LLM guidance highlights output handling, sensitive data, and overreliance risk; GOV.UK service-manual usability guidance supports task-based issue recording instead of broad satisfaction notes.

Skill-backed exploration conclusions:

- Opportunity-solution framing: the highest-value opportunity is turning "AI review feels risky" into a visible repair path, not expanding model/provider scope.
- Recommendation canvas: the customer outcome is faster operator confidence in which recap sections can be reused; the business outcome is a stronger V0 trial signal before production investment.
- UI/UX search: keep a dense operational dashboard pattern with clear loading/error/success states; discard marketing-style webinar recommendations as off-fit for this product.
- Frontend design stance: keep the existing calm Chinese operations workbench and use source/feedback/status density as the product highlight, not decorative styling.

## What Changes

- Add run-level AI review quality triage that prioritizes the most important blocker or repair action for the selected run.
- Add section-level repair guidance that explains why a generated section can be reused, needs evidence review, needs knowledge/source repair, or should remain out of downstream workflows.
- Fold existing validation results, source coverage, human review state, feedback signals, and downstream eligibility into a deterministic client/domain helper.
- Show a compact quality triage panel in `/ai-review` near existing evidence confidence and generated sections.
- Extend the V0 AI review verifier to cover deterministic triage behavior without live DeepSeek calls.
- Keep all routing review-only: no automatic knowledge publishing, source trust changes, prompt mutation, downstream publication, RAG retrieval, queue, analytics, or new provider behavior.

## Capabilities

### New Capabilities

- `ai-review-quality-triage`: Defines the deterministic AI review quality triage summary and section repair guidance used before downstream reuse.

### Modified Capabilities

- `ai-review-workbench`: Adds visible quality triage and repair-path UI requirements for the selected AI review run and generated section cards.
- `operator-v0-ai-review-workflow`: Requires the V0 browser workflow and verifier to expose triage guidance before downstream draft creation.
- `ai-review-feedback-learning-loop`: Requires existing feedback signals to drive visible repair routing without changing authoritative knowledge or prompt behavior automatically.

## Impact

- Affected frontend/domain code: `apps/web/src/lib/ai-review-v0-workflow.ts`, `apps/web/src/components/ai-review-workbench.tsx`.
- Affected verification: `apps/web/src/server/ai-review/operator-v0-check.ts`, `pnpm ai-review:v0-check`, lint/type/build, and Playwright before archive because `/ai-review` rendered UI changes are in scope.
- No new dependencies, database migrations, provider SDKs, RAG, queue, analytics, auth provider, or production deployment target.
- Sensitive-data posture remains unchanged: use only safe run detail fields already returned by protected AI review routes; do not expose cookies, provider keys, full prompts, provider payloads, database URLs, full transcripts, personal data, or cross-team data.
