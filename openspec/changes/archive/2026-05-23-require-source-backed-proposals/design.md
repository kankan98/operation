## Context

The project already requires OpenSpec for non-trivial changes, but the current
rules do not make pre-proposal evidence and value exploration explicit enough.
The user has now set two durable expectations:

- Before every requirements or proposal phase, check reliable professional,
  official, primary, or otherwise credible sources.
- Before creating the proposal, use relevant skills to explore whether the work
  has real user value, stays aligned with the original product direction,
  satisfies operator expectations, and can create a restrained product highlight
  without violating the code and UX baseline.
- During development, if implementation evidence shows that a requirement,
  spec, route, contract, or rule is unreasonable, conflicts with user needs, or
  has drifted from the badminton live-commerce operations goal, adjust the
  durable artifact before continuing rather than forcing the original plan.

This is a governance-only change. It affects how future changes are proposed and
documented; it does not change runtime code, UI behavior, deployment, data
handling, or AI provider choices.

Source-backed rationale checked for this governance change:

| Source | Why it is reliable | Design implication |
| --- | --- | --- |
| NIST AI Risk Management Framework 1.0 (`nist.gov/itl/ai-risk-management-framework`) | Official NIST framework for managing trustworthy AI risks. | Proposal research must include uncertainty, risk, accountability, and verification impact when AI behavior or data handling is involved. |
| W3C PROV-O Recommendation (`w3.org/TR/prov-o/`) | W3C recommendation for representing provenance through entities, activities, agents, derivation, and attribution. | Proposal sources need provenance: what was checked, where it came from, why it is trusted, and how it affects scope. |
| OWASP Top 10 for LLM Applications (`genai.owasp.org/llm-top-10/`) | Security community guidance for common LLM application risks. | Research and AI-product proposals must account for prompt injection, sensitive data disclosure, poisoned or low-quality knowledge, and review-only source handling. |
| ISO 9241-210 human-centred design overview (`iso.org/standard/77520.html`) | International standard for human-centred design of interactive systems. | Proposal exploration must consider users, tasks, context of use, and user outcomes instead of only implementation ideas. |

## Goals / Non-Goals

**Goals:**

- Add a pre-proposal gate that combines reliable source research with
  skill-backed value exploration.
- Require future proposals to explain which operator role benefits, what job is
  improved, what friction is reduced, and what outcome the user can achieve.
- Require future proposals to explain whether the idea is a necessary baseline,
  an operator-visible highlight, a prerequisite, or something to defer.
- Keep the process pragmatic: the research and skill pass should inform real
  development scope, not become a separate essay or detached market report.
- Record source reliability and skill usage in durable artifacts when the
  findings affect scope, risk, UX, verification, AI behavior, or data handling.

**Non-Goals:**

- Do not require exhaustive research for tiny maintenance, diagnostics, typo
  fixes, or purely local non-behavioral edits.
- Do not turn research results into authoritative business facts or AI grounding
  without the knowledge lifecycle source, review, version, and refresh process.
- Do not require the same skill every time. The agent must choose relevant
  skills based on the problem: OpenSpec exploration for scope, product discovery
  skills for user value, UI/UX skills for screens, security or AI skills for
  risk-heavy changes, and implementation/review skills for engineering work.
- Do not let "highlight" mean decorative, noisy, or marketing-first UI. Product
  highlights must still support operator speed, clarity, accessibility, and
  maintainability.

## Decisions

### Decision 1: Add a pre-proposal gate, not a new runtime feature

Future proposal work will begin with two checks:

1. Reliable source research for external or uncertain facts.
2. Relevant skill exploration for user value, alignment, UX quality, and
   feasibility.

This belongs in governance because it applies across future contracts, frontend
work, AI behavior, data handling, and integration decisions.

Alternatives considered:

- Only update the current proposal template: too narrow because future agents may
  start from rules or roadmap without reading a specific old proposal.
- Only rely on final verification: too late because poor feature selection or
  unreliable assumptions are proposal-scope problems.

### Decision 2: Make source reliability explicit

Proposals or designs that rely on external research must identify source type,
why it is trustworthy, and how the finding changed the proposal. Official and
primary sources are preferred for technology, platform, security, legal, and AI
decisions. Professional or industry sources may supplement product context when
their limitations are recorded.

Alternatives considered:

- Allow generic "researched online" notes: insufficient because it does not
  protect against fake, stale, or irrelevant sources.
- Require citations in every tiny edit: too heavy and would slow low-risk
  maintenance.

### Decision 3: Require skill-backed value exploration

Before non-trivial requirements or proposal work, agents must use relevant
skills to test the idea from the target user's perspective. The minimum outcome
to capture is:

- target operator role,
- workflow/job improved,
- current friction or risk,
- expected user outcome,
- whether the idea is on-goal or drifting,
- what would make it a restrained product highlight,
- what verification would prove the outcome.

Relevant skill choices are contextual. Examples:

- `openspec-explore` for ambiguous scope, trade-offs, and change framing.
- Product discovery skills such as problem framing, opportunity solution tree,
  prioritization, JTBD, or story mapping when selecting what to build.
- `ui-ux-pro-max` and `frontend-design` for UI, dashboard, form, table, or
  component work.
- Security, AI, code review, or architecture skills when the proposal touches
  sensitive data, AI behavior, dependencies, or shared boundaries.

Alternatives considered:

- Mandate one fixed product skill for every proposal: too rigid and likely to
  produce ritual work unrelated to the actual task.
- Treat skill use as optional: conflicts with the user's request and makes it
  easy for future agents to skip value exploration.

### Decision 4: Define "above expectation" through operator value, not visual excess

Future proposals may include a product highlight when it makes the operator
faster, clearer, more confident, or more able to reuse team knowledge. A
highlight is not acceptable when it mainly adds decoration, animation, copy bulk,
or workflow complexity.

Alternatives considered:

- Avoid all delight or polish: too conservative and may produce a functional but
  forgettable tool.
- Optimize for flashy UI: conflicts with the operational-tool baseline and
  would increase cognitive load.

### Decision 5: Allow governed mid-development correction

Development is allowed to improve the plan as evidence appears. If coding,
verification, source research, or UX review reveals business drift, a
user-value gap, a conflict between rules, an unrealistic assumption, or a better
smaller slice, the agent must update the relevant OpenSpec artifact, contract,
rule, roadmap, or task list before relying on the revised direction.

Alternatives considered:

- Treat OpenSpec as frozen after proposal approval: too rigid for an autonomous
  development loop and can preserve bad assumptions.
- Change implementation silently and explain later: too risky because future
  agents would not see the durable decision or the reason for divergence.

## Risks / Trade-offs

- Research overhead slows small changes -> Keep the gate scoped to non-trivial
  requirements and proposal work; tiny maintenance keeps the existing exception.
- Agents may cite weak sources to satisfy the rule -> Require reliability
  rationale and explain how each source changed scope, risk, or verification.
- Skill usage can become performative -> Require concrete value outputs tied to
  operator role, workflow friction, outcome, and verification.
- Research may be mistaken for approved business knowledge -> Route reusable
  business/domain facts through the knowledge lifecycle before grounding AI
  answers or operator workflows.
- "亮点" may drift into decorative design -> Tie highlights to operator speed,
  clarity, confidence, reuse, accessibility, and maintainability.
- Mid-development changes could create scope creep -> Only adjust durable
  artifacts when evidence shows business drift, user-value failure, unreasonable
  assumptions, conflicting guidance, or a smaller better path; keep changes
  scoped and verify after the adjustment.
