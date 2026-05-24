## Why

AI review, session capture, and the current roadmap all refer to next-session
tasks, but there is no contract for turning accepted review findings into
owned, reviewable, time-bound work. Defining this boundary now prevents future
runtime work from treating next actions as generic todos without source
provenance, permissions, status transitions, or sensitive-data controls.

Pre-proposal evidence:

- Reliable sources checked:
  - Asana task management guidance (`https://help.asana.com/s/article/understanding-tasks?language=en-US`)
    was checked as an official work-management reference because future tasks
    need clear assignee, due date, status, subtasks/checklist, and source
    context rather than loose notes.
  - Atlassian Jira workflow guidance (`https://www.atlassian.com/software/jira/guides/workflows/overview`)
    was checked as an official workflow reference because next-session tasks
    need explicit statuses, valid transitions, and blocked/reopened handling.
  - TikTok Shop Seller University LIVE Shopping guidance
    (`https://seller-us.tiktok.com/university/course?content_id=7246262315386626&lang=en&learning_id=84434503206657`)
    was checked because live-commerce follow-up work should connect prior
    performance and preparation to the next live session rather than existing
    as standalone project-management work.
- Relevant skills used:
  - `openspec-explore`: confirmed this is a contract-first stage-1 wave, not a
    UI/runtime/database implementation.
  - `openspec-propose`: used to create a governed OpenSpec change before adding
    durable task artifacts.
  - `roadmap-planning`: confirmed this contract belongs before AI review MVP,
    task persistence, feedback learning, and Q&A/RAG downstream reuse.
  - `user-story`: framed the core outcome as: as a live operator or team lead,
    I want accepted review findings to become owned next-session tasks with
    due dates, evidence, and status so that the team can prepare the next live
    session without losing decisions in notes.
- User-value check:
  - Target roles: live operator, host/assistant, product owner, reviewer, and
    team lead.
  - Workflow improved: converting session findings, AI review recommendations,
    knowledge gaps, talk-track updates, and short-video ideas into accountable
    next-session preparation.
  - Expected result: operators know who owns each follow-up, why it exists, when
    it is due, what session/product/AI run it came from, and whether it is ready
    for the next live session.
  - Product highlight: a "why this task exists" evidence trail linking a task
    to session input, reviewed AI output, product/knowledge versions, blockers,
    checklist progress, and follow-up result without exposing raw customer data.

## What Changes

- Add a `next-session-task` contract draft under `docs/contracts/` covering:
  - runtime non-implementation status and stage gates,
  - task, source, assignee, checklist, dependency, review result, recurrence,
    and feedback-signal entities,
  - commands, queries, request/response shapes, state machines, errors,
    authorization, sensitive data, audit metadata, verification, and open
    questions.
- Update `docs/contracts/README.md` so `next-session-task` is part of the
  current contract baseline.
- Update roadmap and goal documents so future task persistence, AI review
  downstream creation, session follow-up, feedback learning, and team review
  starts from this contract.
- Update OpenSpec specs so `next-session-task` is a prerequisite before runtime
  task APIs, persistence, AI-generated task creation, reviewer closure, or
  follow-up analytics.
- No UI behavior, database table, API route, Server Action, AI provider call,
  dependency, Docker deployment, or public preview change is introduced.

## Capabilities

### New Capabilities

- `next-session-task-contract`: Defines the future next-session task,
  source-provenance, ownership, checklist, dependency, review, feedback,
  authorization, audit, sensitive-data, and verification contract.

### Modified Capabilities

- `continuous-improvement-roadmap`: Adds `next-session-task` as a prerequisite
  before task persistence, AI review downstream creation, session follow-up,
  feedback learning, or team review workflows.
- `technical-architecture-foundation`: Adds explicit contract-first gating for
  task persistence and AI-generated next-session downstream artifacts.

## Impact

- Affected documentation: `docs/contracts/next-session-task.md`,
  `docs/contracts/README.md`,
  `docs/roadmap/ai-continuous-development-goal.md`,
  `docs/roadmap/autonomous-development-roadmap.md`, and
  `docs/architecture/technical-implementation-roadmap.md`.
- Affected OpenSpec specs after archive: new `next-session-task-contract`,
  updated `continuous-improvement-roadmap`, and
  `technical-architecture-foundation`.
- Affected runtime: none.
- Dependencies: none.
- Verification: `openspec validate define-next-session-task-contract`,
  markdown hygiene checks, and `openspec validate --all`. Playwright and Docker
  deploy are skipped because this is a contract/specification wave with no
  rendered UI or runtime preview change.
