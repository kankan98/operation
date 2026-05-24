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
- Which operator role benefits, which workflow improves, and what result can
  the user achieve after this change?
- Can the same outcome be achieved without code, with an existing component, by
  configuration, or with a smaller slice?
- What alternatives were considered and why is this path better?
- Which relevant skills were used before proposal or implementation to test
  user value, goal alignment, UX quality, technical fit, or risk?
- What negative impact does this introduce: maintenance, learning cost,
  performance, bundle/runtime cost, security, testing, migration, or rollback?
- Does it preserve UI/domain/data/AI/integration boundaries?
- If the change aims to exceed baseline expectations, does the product
  highlight improve operator speed, clarity, confidence, reuse, accessibility,
  or decision quality without becoming decorative or overbuilt?
- What verification proves the change works and does not regress existing
  behavior?

If the answer affects architecture, data shape, AI behavior, dependencies,
security, or user experience, record the rationale in the active OpenSpec
artifact or final report.

If the check shows the current plan is wrong for the business workflow, weak for
the target user, internally conflicting, unrealistic, or overbuilt, do not force
the implementation to match stale artifacts. Update the active OpenSpec
proposal, design, specs, tasks, contract, roadmap, or rule first, then continue
from the corrected scope.

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
- Before finalizing non-trivial requirements or OpenSpec proposal scope, use
  reliable professional, official, primary, standards-body, vendor, or otherwise
  credible sources when external knowledge affects the decision.
- For each source that affects scope, risk, UX, AI behavior, data handling,
  dependency choice, or verification, record what was checked, why it is
  credible, and how it changed the decision.
- Do not rely on sources that are unverifiable, stale, promotional, anecdotal, or
  unrelated to the target workflow unless their limitation is explicit and a
  stronger source is unavailable for a low-risk decision.
- Before finalizing non-trivial requirements or proposal scope, use relevant
  skills to explore value and fit. Select the skill by domain: OpenSpec
  exploration for scope, product discovery skills for user problems and
  opportunities, UI/UX skills for screens, security and AI skills for risky
  AI/data work, and review or architecture skills for shared code quality.
- Skill usage must produce a concrete decision, not a ritual note: identify the
  target operator, workflow friction, expected outcome, goal-alignment check,
  scope adjustment, and verification implication when relevant.
- Installed skills and local tools may be used when they materially improve
  design, implementation, verification, or deployment, but their impact should
  be reflected in the active OpenSpec artifact when it affects future
  maintenance.
- Public research can inform decisions, but reusable business knowledge must go
  through source metadata, trust level, review status, versioning, and refresh
  policy before it grounds AI answers or operator workflows.

## Product Value And Highlights

- Build from the operator's work, not from generic SaaS patterns. A proposal or
  implementation should make live preparation, product explanation, customer
  Q&A, session review, talk-track reuse, or next-session planning easier.
- Above-baseline product quality is encouraged when it creates practical value:
  faster scanning, clearer decisions, better confidence, safer AI use, reusable
  team knowledge, or fewer manual steps.
- Do not equate "highlight" with visual excess. Avoid decorative animation,
  loud styling, oversized copy, novelty interactions, or workflow complexity
  when they do not improve the operator's outcome.
- If a candidate idea is technically interesting but weakly connected to the
  badminton live-commerce operations goal, defer it or reframe it around a
  validated operator need, accepted contract, security requirement, or
  verification gap.
- During implementation, keep challenging the plan against business common
  sense and operator expectations. When the code reveals that the feature will
  not be useful, will confuse users, or will create avoidable maintenance risk,
  correct the durable artifact before shipping the behavior.

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
- Product UI copy must reduce user effort: use short, familiar, action-oriented
  language and avoid unnecessary concepts.
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
