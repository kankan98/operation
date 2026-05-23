## Context

The repository now has a working Next.js operator workspace, public Docker
preview, global theme governance, motion standards, static session capture,
knowledge learning, and AI review workbench slices. The user wants development
to continue as an autonomous, self-improving product effort rather than a set of
disconnected page additions.

The accepted specs already define the product direction, AI/knowledge feedback
loop, architecture boundaries, theme tokens, and verification baseline. The gap
is an explicit operating model that future agents can follow when they discover
missing product capability, unclear domain knowledge, UX weaknesses, stale docs,
or dependency/tooling needs.

## Goals / Non-Goals

**Goals:**

- Define one durable roadmap capability for continuous autonomous iteration.
- Sequence the current product direction into Now/Next/Later waves that can be
  turned into future OpenSpec changes.
- Define when agents may use web research, skills, new tools, or dependencies.
- Require every self-discovered improvement to be recorded in specs, docs, or
  tasks before it is treated as production work.
- Keep the roadmap focused on Chinese badminton-racket live-commerce operators
  and their daily workflows.
- Preserve public preview quality by making deploy checks part of the iteration
  loop when frontend behavior changes.

**Non-Goals:**

- Do not implement the Q&A agent, database, auth, AI provider, search provider,
  crawler, queue, or storage in this change.
- Do not grant permission to bypass platform terms, privacy rules, tenant
  isolation, source review, or verification.
- Do not make the roadmap a date commitment; it is a Now/Next/Later learning
  plan that changes through OpenSpec.

## Decisions

1. **Create a new `continuous-improvement-roadmap` capability.**
   - Rationale: The objective spans product, docs, research, UX, deployment, and
     AI learning, so it deserves a first-class spec rather than being buried in
     a README.
   - Alternative considered: only update `product-strategy-foundation`. Rejected
     because product strategy states what to build, while the new capability
     governs how future agents keep the project improving.

2. **Use a Now/Next/Later roadmap instead of fixed dates.**
   - Rationale: The project is still early and many infrastructure choices need
     OpenSpec decisions. Now/Next/Later keeps sequencing clear without pretending
     unknown provider, data, or integration work is already scheduled.
   - Alternative considered: quarter-based roadmap. Deferred until real team
     capacity, deployment provider, and production data constraints exist.

3. **Allow autonomous research only as a governed input.**
   - Rationale: The final product needs public professional data and up-to-date
     domain knowledge, but unreviewed web findings must not become authoritative
     product knowledge.
   - Alternative considered: let agents freely add web results to code or
     content. Rejected because source quality, terms, privacy, and review status
     matter for AI grounding and operator trust.

4. **Allow dependencies and skills through a justification gate.**
   - Rationale: The user explicitly permits installing skills and dependencies
     when needed. The project still needs to avoid unnecessary packages and
     hidden architecture decisions.
   - Alternative considered: freeze dependencies until user approval. Rejected
     because it conflicts with the requested autonomous mode.

5. **Make UX usefulness a recurring verification checkpoint.**
   - Rationale: The target user is an operator trying to prepare, review, and
     improve live selling work. Each wave should prove it reduces operator
     effort or increases answer quality, not merely add AI-shaped surfaces.

## Risks / Trade-offs

- Scope creep from autonomous improvement -> Mitigation: every non-trivial
  change still requires OpenSpec, explicit scope, tasks, and verification.
- Stale or low-quality web data entering the product -> Mitigation: web research
  is source-backed input only; reusable facts require metadata, trust, review,
  versioning, and refresh policy before AI grounding.
- Dependency bloat -> Mitigation: each dependency must state the problem,
  alternatives, maintenance/runtime impact, and rollback path in the active
  change.
- Agent improves docs but not product usefulness -> Mitigation: roadmap tasks
  must tie back to operator workflows and include UX/workflow verification.
- Public preview drift -> Mitigation: frontend changes require build/browser
  checks and public container update when the preview is part of the task.

## Migration Plan

1. Add the continuous improvement roadmap spec.
2. Add product strategy requirements for operator usefulness and sequenced Q&A
   agent delivery.
3. Add AI development governance requirements for autonomous research, skill
   use, dependency changes, and docs/spec upkeep.
4. Add a roadmap document that consolidates current routes, standards, docs,
   deployment checks, and next waves.
5. Validate OpenSpec, inspect docs for placeholders, and archive after tasks are
   complete.

## Open Questions

- Production provider, database credentials, AI provider, web search provider,
  and auth provider remain undefined until future OpenSpec changes select them.
- Real operator success metrics need field validation after usable data capture
  and AI workflows exist.
