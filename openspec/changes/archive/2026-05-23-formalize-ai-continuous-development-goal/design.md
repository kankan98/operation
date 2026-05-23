## Context

The project already contains governance rules, accepted OpenSpec capabilities,
workspace routes, a public preview, a Now/Next/Later roadmap, and an agent
architecture baseline. The user's long-running objective is broader than a
single feature: keep improving the system autonomously, research unclear topics,
add justified skills or dependencies when needed, and always optimize for the
real target users: Chinese badminton racket live-commerce operators.

The current gap is coordination. Future agents can find the roadmap and rules,
but there is no single document that turns the user's objective into an
operational goal with iteration lanes, decision rules, user-value checks,
collaboration points, and completion evidence.

## Goals / Non-Goals

**Goals:**

- Create a durable project goal document for AI-driven continuous development.
- Tie development tasks, roadmap lines, accepted specs, current docs, and
  verification gates into one execution model.
- Define how agents choose the next useful work item when the user says
  "continue".
- Make research, skill use, tool installation, and dependency proposals allowed
  but governed by OpenSpec and verification.
- Capture the target user experience: dense Chinese operator workflows that
  save real preparation, review, answering, and follow-up effort.
- Document the limited collaboration required from the user, especially external
  credentials, product truth decisions, and business-sensitive approvals.

**Non-Goals:**

- No runtime code or UI behavior changes.
- No backend, database, auth, RAG, AI provider, web discovery, or persistent
  feedback implementation.
- No new package dependency or installed skill.
- No claim that the overall product is complete. This change only formalizes
  the ongoing execution goal and governance.

## Decisions

1. **Use one goal document instead of expanding every README.**
   - Decision: Add `docs/roadmap/ai-continuous-development-goal.md`.
   - Rationale: The roadmap is already long and tactical. A separate goal
     document can explain the durable objective, operating model, and user-value
     tests without turning the roadmap into a policy dump.
   - Alternative considered: only expand `autonomous-development-roadmap.md`.
     Rejected because route sequencing and goal governance would become mixed.

2. **Keep OpenSpec as the source for enforceable capability behavior.**
   - Decision: The goal document can guide prioritization, but non-trivial work
     still starts with an OpenSpec change and accepted specs remain normative.
   - Rationale: The user wants autonomous iteration, but backend, AI, RAG,
     data, security, UX, and dependencies need reviewable artifacts.
   - Alternative considered: let the goal document directly authorize broad
     implementation. Rejected because it would weaken architecture boundaries.

3. **Use a Now/Next/Later plus evidence ledger model.**
   - Decision: The goal document will identify current lanes, next candidates,
     and the evidence required before an agent claims a wave is complete.
   - Rationale: Autonomous work needs both direction and auditability. Evidence
     prevents vague progress reports from replacing real verification.
   - Alternative considered: maintain a pure backlog list. Rejected because it
     would not explain why work is sequenced or how value is checked.

4. **Document user collaboration as scarce and explicit.**
   - Decision: Agents should proceed independently except when external account
     permissions, credentials, business truth, legal/platform constraints, or
     sensitive data approval are required.
   - Rationale: The user explicitly delegated execution, but some external
     state cannot be solved from the repository.
   - Alternative considered: ask for confirmation at every planning milestone.
     Rejected because it conflicts with the requested autonomous loop.

## Risks / Trade-offs

- Goal document becomes stale -> Mitigation: add OpenSpec requirements that
  future development waves update the goal or roadmap when durable direction
  changes.
- Agents treat the goal document as permission to skip specs -> Mitigation:
  explicitly state that OpenSpec, security rules, and verification remain gates.
- Research introduces unreliable facts -> Mitigation: reusable product knowledge
  must enter the knowledge lifecycle with source metadata, trust level, review,
  versioning, and refresh policy.
- "Autonomous learning" is over-interpreted as production self-modification ->
  Mitigation: define staged Q&A learning where feedback and web findings are
  auditable signals until reviewed.
- Completion is impossible to prove for the whole product in one wave ->
  Mitigation: distinguish the long-running product goal from individual
  implementation wave completion evidence.
