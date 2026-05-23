## Context

The repository already has project rules and implementation-quality guidance,
but the rules are not detailed enough to prevent architectural drift as the
application grows from static workbenches into real API, database, AI, RAG,
review, and team workflows. The user explicitly wants pre-coding reasoning:
whether something is needed, what happens if it is used, alternatives, negative
impact, architectural conflict, and long-term maintainability.

This change strengthens engineering governance without touching runtime code.

## Goals / Non-Goals

**Goals:**

- Add a detailed code architecture standards document under `docs/engineering/`.
- Add mandatory pre-coding gates to `.codex/rules/03-implementation-quality.md`.
- Make architecture boundaries, dependency decisions, abstraction decisions,
  module size, duplication, readability, tests, and refactoring expectations
  explicit.
- Link the standards from `AGENTS.md`, `.codex/rules/README.md`, and root
  `README.md`.

**Non-Goals:**

- No code refactor in this change.
- No new linting package, formatter, analyzer, or CI setup.
- No new runtime dependency.
- No change to frontend visual design, routes, Docker image, or public preview.

## Decisions

1. **Use rules plus a deeper engineering document.**
   - Decision: Keep mandatory behavior in `.codex/rules/03-implementation-quality.md`
     and place the longer rationale/checklists in
     `docs/engineering/code-architecture-standards.md`.
   - Rationale: Agents need a short required read and a detailed reference.
   - Alternative considered: only expand `.codex/rules/03...`. Rejected because
     the rule file would become too long for fast task startup.

2. **Make "do we need this?" a gate, not a suggestion.**
   - Decision: The standards require agents to consider necessity, alternatives,
     negative effects, architectural impact, blast radius, test needs, and
     rollback before coding.
   - Rationale: This directly addresses drift, redundant abstractions, and
     speculative dependency growth.
   - Alternative considered: rely on code review. Rejected because the goal is
     to prevent bad structure before it is written.

3. **Preserve current architecture boundaries.**
   - Decision: The standards reinforce UI, domain, data, AI, integration, and
     contract boundaries from `AGENTS.md`.
   - Rationale: Future backend and AI work will cross many modules. Boundary
     discipline must exist before those modules are added.
   - Alternative considered: defer standards until backend exists. Rejected
     because retrofitting boundaries later is more expensive.

## Risks / Trade-offs

- Rules become too heavy and slow down small fixes -> Mitigation: distinguish
  tiny maintenance from non-trivial changes and scale the decision record to
  risk.
- Agents over-document instead of coding -> Mitigation: require concise decision
  notes only when architecture, dependency, data, AI, or shared behavior changes.
- Standards are ignored -> Mitigation: add OpenSpec requirements and required
  read links in the project entry points.
- Standards become stale -> Mitigation: future framework, database, AI, or
  deployment adoption must update rules through OpenSpec.
