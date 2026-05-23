# Implementation Quality Rules

## Project Fit

- Follow the existing framework, folder structure, naming, linting, and testing patterns.
- Prefer local helpers and established abstractions over new ones.
- Add a new abstraction only when it removes real duplication or isolates meaningful complexity.
- Keep files focused. If a file grows into multiple responsibilities, split it along clear boundaries.

## Coding Decision Gate

Before non-trivial coding, explicitly check:

- Is this change necessary for the current user goal, OpenSpec requirement,
  defect, contract, or verification gap?
- Can the same outcome be achieved without code, with an existing component, by
  configuration, or with a smaller slice?
- What alternatives were considered and why is this path better?
- What negative impact does this introduce: maintenance, learning cost,
  performance, bundle/runtime cost, security, testing, migration, or rollback?
- Does it preserve UI/domain/data/AI/integration boundaries?
- What verification proves the change works and does not regress existing
  behavior?

If the answer affects architecture, data shape, AI behavior, dependencies,
security, or user experience, record the rationale in the active OpenSpec
artifact or final report.

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
- Prevent redundancy as code grows: do not introduce duplicate domain shapes,
  duplicate status components, page-local theme values, or speculative shared
  abstractions without a concrete need.

## Architecture Boundaries

- UI components render workflow state and interaction; they do not call
  databases, LLM providers, vector stores, or external search directly.
- Domain logic owns badminton live-commerce concepts and rules.
- Data/repository code owns persistence, transactions, migrations, and queries.
- AI code owns prompts, provider calls, schema validation, retries, and run
  states.
- Integration code owns external platform/source boundaries.
- Contracts describe future runtime boundaries and must not imply an
  implementation exists.

If an implementation needs to cross these boundaries, update OpenSpec before
coding or choose a boundary-preserving design.

## Interface Copy

- Product UI copy must be written for operators: what they can do, what state
  means, and what action comes next.
- Do not expose development notes, requirement text, OpenSpec references,
  internal architecture, backend/AI/database plans, or implementation rationale
  in normal user-facing pages.
- Use concise product states such as "暂无数据", "请先添加商品", "暂不能保存",
  "需要管理员权限", or "来源待审核".
- Move detailed implementation boundaries and non-goals to README, OpenSpec,
  contract, roadmap, or internal debug/admin surfaces.

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
