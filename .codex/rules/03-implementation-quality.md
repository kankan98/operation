# Implementation Quality Rules

## Project Fit

- Follow the existing framework, folder structure, naming, linting, and testing patterns.
- Prefer local helpers and established abstractions over new ones.
- Add a new abstraction only when it removes real duplication or isolates meaningful complexity.
- Keep files focused. If a file grows into multiple responsibilities, split it along clear boundaries.

## Dependencies

- Do not add dependencies for simple problems that the language, framework, or existing stack already solves.
- Before adding a package, check maintenance status, license suitability, bundle/runtime impact, and whether it works with the project framework.
- Record dependency rationale in the OpenSpec design when the dependency is significant.
- If npm access is slow, the repository may use the configured mirror in
  `.npmrc`; do not change registries without a reason recorded in the active
  task.
- New runtime or build dependencies must have an OpenSpec design note covering
  the problem solved, alternatives considered, maintenance/licensing risk,
  runtime or bundle impact, failure modes, rollback path, and verification.

## Research, Skills, and Tools

- Use current research when a fact may be stale, specialized, platform-specific,
  legal/compliance-sensitive, or tied to a changing dependency/API.
- Prefer primary or official sources for technical and platform decisions.
- Installed skills and local tools may be used when they materially improve
  design, implementation, verification, or deployment, but their impact should
  be reflected in the active OpenSpec artifact when it affects future
  maintenance.
- Public research can inform decisions, but reusable business knowledge must go
  through source metadata, trust level, review status, versioning, and refresh
  policy before it grounds AI answers or operator workflows.

## Code Changes

- Keep changes minimal and scoped to the active task.
- Avoid broad rewrites, formatting churn, and unrelated refactors.
- Preserve user changes in the working tree.
- Prefer typed, structured APIs over ad hoc string manipulation.
- Avoid global mutable state unless the framework requires it and the lifecycle is clear.

## Comments and Documentation

- Add comments only where they explain non-obvious intent, constraints, or trade-offs.
- Do not add comments that merely repeat the code.
- Update docs, specs, or examples when behavior changes.
- Keep `apps/web/README.md` and
  `docs/roadmap/autonomous-development-roadmap.md` aligned when routes,
  standards, public preview behavior, or future development sequence changes.

## Error Handling

- Handle user-facing errors with actionable messages.
- Log enough context for debugging without leaking secrets or sensitive data.
- Make failure states explicit in UI and API flows.

## Data Modeling

- Use explicit schemas or typed interfaces for persisted, shared, or AI-produced data.
- Store timestamps with timezone-aware semantics where applicable.
- Do not store derived AI output as authoritative truth unless the product explicitly requires human approval or audit metadata.

## AI Feature Implementation

- Separate prompts, model invocation, parsing, validation, and persistence.
- Validate model outputs before using them in product flows.
- Keep prompts versioned or otherwise traceable when output quality matters.
- Design for retries, partial failures, and provider errors.
