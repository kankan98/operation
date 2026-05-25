## Why

The AI review V0 can already prepare runs, generate structured suggestions, record
accept/reject decisions, and create downstream draft references, but the browser
workflow does not yet make the quality-feedback loop usable. Operators need a
quick way to mark missing knowledge, wrong sources, weak evidence, and downstream
use so AI review output becomes safer to reuse and produces evaluation data for
later Q&A/RAG work.

This is the next smallest coherent MVP wave because it improves trust in the
existing AI review workflow without expanding automation, provider scope, or
production auth.

## Source Research

- NIST AI Risk Management Framework, official source:
  https://www.nist.gov/itl/ai-risk-management-framework
  - Decision impact: AI review should prioritize human oversight, traceability,
    and quality evidence before increasing automation.
- OWASP Top 10 for LLM Applications 2025, official project source:
  https://owasp.org/www-project-top-10-for-large-language-model-applications/
  - Decision impact: feedback UI and route responses must not expose secrets,
    prompts, provider payloads, raw transcripts, cookies, database URLs, or
    sensitive customer/operator data.
- W3C PROV-O, official W3C recommendation:
  https://www.w3.org/TR/prov-o/
  - Decision impact: feedback signals should keep provenance links to run,
    section, actor, route, and downstream artifact rather than becoming
    untraceable notes.
- Nielsen Norman Group usability heuristics, professional UX source:
  https://www.nngroup.com/articles/ten-usability-heuristics/
  - Decision impact: the UI should make feedback status visible, keep user
    actions recoverable, prevent accidental misuse, and use operator-facing
    Chinese copy.
- Next.js App Router documentation, official framework source:
  https://nextjs.org/docs/app
  - Decision impact: keep server secrets on the server, keep no-store protected
    API reads explicit, and do not expose provider configuration details through
    client code.

## Skill-Backed Value Exploration

- OpenSpec exploration: The existing specs already define feedback signals and
  downstream handoff. The gap is the browser-level workflow, summary state, and
  verification that prove those signals are actually usable.
- Superpowers brainstorming, adapted to the project autonomy rule: The design
  options were narrowed to an OpenSpec-governed workflow wave instead of pausing
  for a new standalone design approval, because the user explicitly asked for
  autonomous continuation and faster workflow-level delivery.
- AI-shaped readiness: The project should improve context design, agent
  traceability, and team-AI review practice before adding more autonomous AI
  behavior. Feedback routing to evaluation, knowledge review, and prompt review
  is the highest-leverage next capability.
- UI/UX skill search: Adopt only the relevant guidance from data-dense review
  dashboards: compact feedback summaries, accessible controls, clear status,
  and scannable review categories. Reject the suggested dark commerce-rating
  visual style because it conflicts with the existing calm operator workspace.
- Prioritization lens: In the current early MVP stage with limited real usage
  data, use value/effort rather than RICE. Feedback learning is high value and
  low architecture risk because persistence and protected routes already exist.

## What Changes

- Add operator-facing feedback controls to `/ai-review` generated sections for:
  accepted, rejected, missing knowledge, wrong source, weak evidence, and
  downstream used.
- Expose feedback signals in the client AI review run detail type and render a
  compact run-level quality summary.
- Route feedback signals to the existing evaluation, knowledge review, prompt
  review, or none destinations according to the signal type, without changing
  authoritative knowledge.
- Record feedback immediately after accept/reject and from explicit quality
  feedback buttons, using the existing protected feedback-signals route with
  tenant/team scope and AI review CSRF.
- Show feedback history and review priority in operator-facing Chinese copy,
  keeping AI suggestions distinct from human facts and downstream drafts.
- Extend repeatable verification so AI review V0 proves feedback recording,
  summary loading, route redaction, and client type coverage without calling a
  live provider.
- Update docs/roadmap/contracts/specs to reflect that AI review feedback is now
  usable in the V0 browser workflow and remains a review signal rather than an
  automatic knowledge update.

No production auth provider, RAG retrieval, Q&A runtime, queue, external source
discovery, new database table, new npm dependency, or default live DeepSeek call
is introduced in this wave.

## Capabilities

### New Capabilities

- `ai-review-feedback-learning-loop`: V0 operator feedback workflow for AI review
  quality signals, run-level summary, routing to future evaluation/knowledge/
  prompt review queues, and repeatable verification.

### Modified Capabilities

- `ai-review-workbench`: Make the visible operator feedback loop operational
  rather than only previewed.
- `operator-v0-ai-review-workflow`: Extend the browser workflow to record and
  reload feedback signals in the local V0 team context.
- `ai-review-api-runtime`: Clarify client-facing detail/route expectations for
  feedback signal visibility and redacted verification.
- `continuous-improvement-roadmap`: Record feedback learning as the current
  bridge between AI review MVP and later Q&A/RAG evaluation.

## Impact

- Affected UI/client code: `apps/web/src/components/ai-review-workbench.tsx`,
  `apps/web/src/lib/ai-review-v0-workflow.ts`, and possibly shared downstream
  workflow helpers if downstream-used feedback needs a reusable mapping.
- Affected server verification: `apps/web/src/server/ai-review/route-check.ts`,
  `apps/web/src/server/ai-review/operator-v0-check.ts`, and/or a focused new
  AI review feedback verifier.
- Affected docs/specs: active OpenSpec specs, `docs/contracts/ai-review-run.md`,
  `docs/roadmap/ai-continuous-development-goal.md`, and
  `docs/roadmap/autonomous-development-roadmap.md`.
- Affected verification: `openspec validate`, `pnpm ai-review:route-check`,
  `pnpm ai-review:v0-check`, focused feedback verification if added,
  `pnpm lint`, `pnpm typecheck`, `pnpm build`, and Playwright before archive
  because `/ai-review` rendered behavior changes.
