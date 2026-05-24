## Context

The current app has a `/next-actions` placeholder page, while the session
capture contract marks next actions as a downstream workflow and the AI review
contract models `next_session_action` sections plus downstream artifacts. The
data foundation and auth/team/tenant contracts already reserve `next_task` and
`manage_next_tasks`, so the remaining missing boundary is how follow-up work
becomes an accountable operational record.

Next-session tasks are not generic project-management items. In this product,
they must connect live-session findings, product models, knowledge gaps,
accepted AI review sections, talk-track updates, short-video planning, owners,
due dates, checklist progress, blockers, and follow-up results. They also carry
business-sensitive context: customer questions, product strategy, pricing
notes, supplier details, and AI output must not leak into task text or logs.

Research and skill exploration affected the design:

- Asana's official task guidance reinforced task ownership, due dates,
  checklist/subtask structure, and context as minimum practical task fields.
- Atlassian Jira workflow guidance reinforced explicit workflow statuses,
  transitions, blocked states, and reopening rather than free-form status text.
- TikTok Shop LIVE Shopping guidance reinforced that follow-up work must serve
  the next live-selling cycle: product preparation, live interaction,
  promotion, and content readiness.
- `roadmap-planning` keeps this contract sequenced before AI review runtime,
  task persistence, feedback learning, and team reporting because all of those
  need stable task ownership and provenance.
- `user-story` framed the acceptance outcome as owned, evidence-linked,
  time-bound work that a live operator can act on before the next session.

## Goals / Non-Goals

**Goals:**

- Define the future next-session task boundary before persistence or UI work.
- Define task records, source provenance, assignees, checklist items,
  dependencies, review results, recurrence, and feedback signals.
- Preserve the distinction between human-created tasks, accepted AI review
  suggestions, knowledge gaps, talk-track changes, and task completion results.
- Define task states so teams can draft, assign, start, block, complete, cancel,
  reopen, archive, and review tasks safely.
- Define authorization, sensitive data, audit metadata, and verification
  requirements for future runtime work.

**Non-Goals:**

- No database schema, repository, API, Server Action, AI provider call, RAG
  retrieval, UI redesign, dependency, or Docker deployment is added.
- No actual task content, sample team workflow, notification system, calendar
  sync, queue, or analytics implementation is added.
- No claim is made that `/next-actions` can save, assign, complete, or review
  real tasks yet.
- No automatic AI task creation: AI review can propose candidates later, but
  human acceptance or configured review policy remains required before tasks
  affect the team workflow.

## Decisions

### Decision 1: Tasks are source-linked operational records, not generic todos

Each task identifies its source workflow, source record, source state,
supporting references, target session, related products, knowledge versions,
AI run, and whether it is human-created or AI-suggested. This keeps the team
from losing why the work exists and prevents task lists from drifting into
generic personal productivity.

Alternatives considered:

- Store only title, owner, and status: simpler, but loses provenance and makes
  AI or session-derived tasks hard to audit.
- Keep follow-up work inside session notes only: keeps capture simple, but
  makes ownership, due dates, blocking, and cross-session follow-up weak.

### Decision 2: Ownership and due date are first-class

Tasks must support a primary owner, optional collaborators, due date, priority,
and review requirement. A team lead can see which next-session actions are
ready, blocked, overdue, or waiting for review.

Alternatives considered:

- Allow unowned task pools: flexible, but weak for live-commerce preparation
  where missing a product check, talk-track update, or knowledge gap affects the
  next session.
- Model owner as free text: convenient for static UI, but incompatible with
  future team permissions and audit.

### Decision 3: The state machine allows blocking and reopening

The contract uses explicit states: `draft`, `assigned`, `in_progress`,
`blocked`, `done`, `reviewing`, `closed`, `reopened`, `canceled`, and
`archived`. Completion and closure are distinct so reviewer-required tasks do
not become final without review.

Alternatives considered:

- Only `todo`, `doing`, `done`: too thin for AI-derived recommendations,
  reviewer-owned closure, and blocked dependencies.
- Require review for every task: safer, but too slow for simple operator-owned
  preparation.

### Decision 4: AI review can propose tasks, but accepted workflow controls creation

AI review sections may become task candidates only when the source run and
section are eligible. Future runtime work must record AI run ID, section ID,
prompt version, validation state, reviewer decision where required, and the
actor who creates or accepts the task.

Alternatives considered:

- Auto-create every AI task suggestion: fast, but creates noisy task lists and
  can turn weak AI recommendations into operational commitments.
- Forbid AI-derived tasks: safer short-term, but breaks the intended review to
  next-session preparation loop.

### Decision 5: Sensitive context is referenced, not copied

Task bodies should summarize work to be done and reference source records by
ID. They must not store raw customer messages, full transcripts, private
messages, order data, phone numbers, addresses, full prompts, or provider
payloads. Sensitive fields are handled by source contracts and redaction states.

Alternatives considered:

- Copy source snippets into each task for convenience: easier reading, but
  multiplies sensitive data and stale context.
- Store only source IDs with no summary: safest, but too hard for operators to
  scan quickly.

## Risks / Trade-offs

- Contract-first work does not improve the placeholder UI immediately -> The
  mitigation is that it prevents later AI review and persistence work from
  creating unsafe, unowned tasks.
- Task metadata may feel heavy -> The mitigation is progressive enrichment:
  title, type, owner, priority, due date, source, and status are core; checklist,
  dependencies, recurrence, and review result can be optional.
- Review states can slow follow-up -> The mitigation is requiring reviewer
  closure only for tasks that affect product facts, published knowledge,
  customer-sensitive handling, or team-wide assets.
- AI suggestions can create noise -> The mitigation is task-candidate gating,
  duplicate detection, reviewer policy, and source readiness checks.
- External live-commerce platform practices can change -> The mitigation is
  keeping task contract grounded in source provenance and review metadata rather
  than hard-coding platform-specific execution rules.

## Migration Plan

1. Add OpenSpec requirements for `next-session-task-contract` and roadmap
   gates.
2. Add `docs/contracts/next-session-task.md`.
3. Update contract index, goal, autonomous roadmap, and technical roadmap.
4. Validate the change and markdown hygiene.
5. Archive the change and validate all accepted specs.

Rollback is documentation-only: revert the contract and spec updates. No data,
dependency, runtime behavior, Docker image, or public preview changes.

## Open Questions

- Which first runtime entry point should create tasks: AI review accepted
  output, manual session follow-up, knowledge gap review, or team lead planning.
- Whether reviewer closure should be required by task type, priority, source, or
  team configuration.
- Whether due dates should be absolute only or support "before next session"
  scheduling once calendar/session planning exists.
- Whether recurrence is needed for repeated live preparation checklists or
  should wait until actual operator behavior validates it.
