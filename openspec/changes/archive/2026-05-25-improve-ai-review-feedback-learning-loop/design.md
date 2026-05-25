## Context

The project already has most of the AI review V0 runtime pieces:

- AI review run repository and protected API runtime include
  `ai_review_feedback_signals`.
- `/api/ai-review/runs/[runId]/feedback-signals` already records signal type,
  reason, priority, route, actor, run, and optional section.
- `getRun` already loads `feedbackSignals` in the repository detail object.
- `/ai-review` already lets operators prepare runs, execute fake/live-gated
  generation, accept/reject sections, and create downstream draft references.

The missing MVP capability is that operators cannot see or use the feedback loop
from the browser. Current section cards only expose accept/reject and downstream
actions. This undercuts trust and later evaluation because missing knowledge,
wrong source, weak evidence, and downstream-used signals remain hidden behind an
API route.

This change sits in the technical roadmap's stage 5 and stage 8 boundary:
AI review MVP feedback learning. It uses existing Route Handlers, repository
records, auth/session scope, and CSRF. It does not introduce a new provider,
database table, queue, RAG index, or production AI release.

## Goals / Non-Goals

**Goals:**

- Make feedback signal capture available in the `/ai-review` V0 browser
  workflow.
- Keep feedback tied to run, section, route, priority, reason, actor, and
  timestamp so later evaluation and knowledge review can use it.
- Show a compact quality summary for the selected run: accepted/rejected,
  missing knowledge, wrong source, weak evidence, downstream used, and routed
  review signals.
- Automatically record basic accepted/rejected feedback when operators use the
  existing decision buttons.
- Add explicit quality feedback controls for missing knowledge, wrong source,
  and weak evidence.
- Record downstream-used feedback when an accepted section creates a downstream
  draft reference.
- Verify the local V0 feedback loop without live DeepSeek calls.
- Update roadmap/contracts to say feedback is now visible/usable in V0 while
  still not authoritative knowledge.

**Non-Goals:**

- No RAG snapshot, Q&A answer generation, public source discovery, or automatic
  knowledge update.
- No new database schema or migration.
- No new auth provider, production login, team management, invitation, or HTTPS
  deployment decision.
- No new npm dependency or design-system replacement.
- No default live DeepSeek smoke. Existing live-model gate remains opt-in.
- No complex analytics dashboard or scoring model. This wave only captures and
  summarizes signals.

## Decisions

### Decision 1: Use existing feedback signal persistence

The browser will call the existing protected feedback route:

```text
POST /api/ai-review/runs/[runId]/feedback-signals
```

The payload will include:

- `sectionId` for section-level feedback;
- `signalType`;
- `reason`;
- `reviewPriority`;
- `routesTo`.

Alternatives considered:

- Add a new feedback endpoint just for V0 UI. Rejected because the API contract
  already exists and adding a parallel endpoint would duplicate authorization,
  validation, and route semantics.
- Add a new feedback summary table. Rejected because summary can be derived from
  existing detail data at this stage.

### Decision 2: Extend client detail types instead of reshaping API response

The server already returns `feedbackSignals` inside run detail. The client type
will be extended to include the existing field and labels. UI summaries will be
computed client-side from the loaded detail.

Alternatives considered:

- Add a server-side summary field. Deferred because there is not yet enough
  product evidence to freeze a summary shape. Client derivation is lower risk
  and uses current data.
- Hide raw feedback signals and only show aggregate counts. Rejected because
  operators need recent reasons to understand what was marked.

### Decision 3: Map feedback signals to conservative routes

Use deterministic route defaults:

| Signal | Priority | Route |
| --- | --- | --- |
| `accepted` | `normal` | `evaluation_set` |
| `rejected` | `normal` | `prompt_review` |
| `missing_knowledge` | `high` | `knowledge_review` |
| `wrong_source` | `high` | `knowledge_review` |
| `evidence_weak` | `normal` | `prompt_review` |
| `downstream_used` | `normal` | `evaluation_set` |

Alternatives considered:

- Let operators manually choose route/priority for every feedback event.
  Rejected for V0 because it slows review and adds terminology that operators do
  not need.
- Route every negative signal to knowledge review. Rejected because weak
  evidence can be prompt or retrieval-quality work, not always a knowledge gap.

### Decision 4: Record feedback after existing decision/downstream actions

When an operator clicks `采纳`, the workflow records the decision and then records
an `accepted` feedback signal. When the operator clicks `暂不用`, it records
`rejected`. When a downstream draft reference is created, it records
`downstream_used`.

If feedback recording fails after a successful decision or downstream reference,
the UI will keep the main action result and show a safe operator-facing message.
It will not roll back the already completed review decision.

Alternatives considered:

- Combine decision and feedback into one new server mutation. Deferred because
  it would change API semantics and increase route blast radius.
- Require operators to click a separate feedback button after every decision.
  Rejected because it creates avoidable duplicate work.

### Decision 5: Keep explicit quality feedback compact

Each generated section card will include compact quality feedback controls for
`缺知识`, `来源不准`, and `证据弱`. These are not destructive actions. They remain
available after review so operators can mark quality issues even when a section
was otherwise useful.

Alternatives considered:

- Use long forms with custom reasons. Deferred because this V0 needs speed; a
  later evaluation workspace can capture richer edited content and samples.
- Use only thumbs up/down. Rejected because it cannot distinguish missing
  knowledge from weak evidence or wrong source.

### Decision 6: Verification stays fake-provider-first

Verification will extend existing AI review checks to prove:

- feedback route records accepted/rejected/knowledge/evidence/downstream
  signals;
- run detail exposes `feedbackSignals`;
- client types and UI can derive summary labels;
- route responses stay redacted;
- no live provider is called by default.

Playwright is reserved for the archive testing stage because the user requested
not to run browser checks every small iteration.

## Risks / Trade-offs

- Duplicate signals from repeated clicks -> Disable feedback buttons while busy
  and display recent feedback so repetition is visible; deeper de-duplication is
  deferred until there is real usage evidence.
- Decision succeeds but feedback fails -> Preserve the review decision and show
  a safe warning instead of losing the operator's main work.
- Too many controls on section cards -> Use short labels, existing button
  styles, stable card dimensions, and compact recent-feedback chips.
- Feedback reason text is generic -> Acceptable for V0; it still produces
  structured signal type, route, priority, and section provenance.
- Operators may think feedback updates knowledge -> UI copy and specs must state
  that feedback routes to review/evaluation and does not overwrite authoritative
  knowledge.
- Summary is client-derived -> Lower backend risk now; if later Q&A/RAG
  evaluation needs server summaries, add them in a separate OpenSpec wave.

## Migration Plan

1. Add OpenSpec delta specs for the new and modified capabilities.
2. Extend client AI review types with `feedbackSignals`, labels, and helper
   functions for route/priority mapping and summaries.
3. Add feedback recording helpers to `/ai-review` and wire them to decisions,
   explicit quality buttons, and downstream creation.
4. Render run-level feedback summary and recent feedback list in the sidebar.
5. Extend route/operator V0 verification to cover feedback detail loading and
   redaction.
6. Update contracts/roadmaps to record the V0 feedback learning state.
7. Run OpenSpec validation and focused code checks; run Playwright before
   archive.

Rollback path: revert the client UI/helper changes. The existing feedback route
and persistence remain backward compatible because this wave does not change the
database schema or server route contract.

## Open Questions

- Whether later evaluation should de-duplicate signals per section and signal
  type remains deferred until real operator usage creates a clearer rule.
- Whether negative feedback should create first-class knowledge review queue UI
  is deferred to a separate knowledge lifecycle or Q&A/RAG feedback wave.
