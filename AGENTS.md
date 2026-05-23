# Agent Instructions

This file is the project-level entry point for AI agents working in this
repository. Read it before making code, spec, data, documentation, or tooling
changes.

## Project Snapshot

This repository started as a governance-first project scaffold and now includes
the first web application baseline under `apps/web`.

Current structure:

- `AGENTS.md`: this root-level agent entry point.
- `package.json` and `pnpm-workspace.yaml`: root workspace commands.
- `.codex/rules/`: canonical repository rules for AI-assisted development.
- `.codex/skills/`: project-local OpenSpec skills.
- `apps/web/`: Next.js App Router application for the operator workspace.
- `docs/roadmap/ai-continuous-development-goal.md`: durable autonomous
  development goal, target users, collaboration boundaries, and evidence rules.
- `openspec/specs/`: accepted project capability specifications.
- `openspec/changes/archive/`: archived OpenSpec changes.

Current product direction, unless superseded by active OpenSpec artifacts:

- Build a web-based AI operations tool for badminton racket live-commerce teams.
- Help operators record, review, and improve live selling content.
- Core domain areas include product explanations, customer questions, talk
  tracks, live-session recaps, short-video topic ideas, and next-session tasks.
- When the user asks agents to "continue" without a narrow task, use
  `docs/roadmap/ai-continuous-development-goal.md` plus
  `docs/roadmap/autonomous-development-roadmap.md` to select the next
  operator-useful, OpenSpec-governed development wave.

The current web baseline is pnpm + Next.js App Router + TypeScript + React +
Tailwind CSS + shadcn/ui-compatible primitives + lucide-react under `apps/web`.
Do not invent database, auth, AI provider, queue, storage, analytics, or
deployment targets before a change artifact defines them.

## Rule Precedence

When instructions conflict, use this order:

1. Direct user instructions in the current conversation.
2. Active OpenSpec artifacts under `openspec/changes/<change>/`.
3. This `AGENTS.md`.
4. Rules under `.codex/rules/`.
5. Existing code, tests, docs, and local conventions.
6. General model knowledge.

If the conflict changes product behavior, security, data handling, or architecture,
pause and explain the conflict instead of silently choosing.

## Required First Reads

Before non-trivial work, read:

1. `AGENTS.md`
2. `.codex/rules/README.md`
3. `docs/roadmap/ai-continuous-development-goal.md` when continuing
   autonomous project development or choosing the next wave
4. Relevant `.codex/rules/*.md`
5. `docs/engineering/code-architecture-standards.md` before non-trivial code,
   architecture, dependency, abstraction, or UI copy work
6. Relevant OpenSpec artifacts
7. Nearby code or docs, once application code exists

Use `rg` and focused reads. Avoid broad context loading when a narrower lookup is
enough.

## Technical Architecture Boundaries

Current architecture includes repository governance plus the first web app
baseline:

```text
repository root
├── AGENTS.md
├── package.json
├── pnpm-workspace.yaml
├── .codex/
│   ├── rules/              # project AI development rules
│   └── skills/             # project-local OpenSpec skills
├── apps/
│   └── web/                # Next.js App Router operator workspace
└── openspec/
    ├── specs/              # accepted capability specs
    └── changes/archive/    # completed OpenSpec changes
```

The web framework and app directory are now defined. Agents must still not
assume the following until an OpenSpec change introduces them:

- Backend framework: Node, Python, Go, serverless, monolith, etc.
- Database: Postgres, SQLite, Redis, object storage, vector database, etc.
- Auth provider, AI provider, payment provider, queue, analytics, or deployment
  target.
- Shared package directories such as `packages/`, or server-only directories
  such as `server/`, unless a future change defines them.

When introducing any of the above, create or update an OpenSpec change that
records:

- Why the technology is needed.
- What alternatives were considered.
- Runtime boundaries and data flow.
- Failure modes and rollback path.
- Verification requirements.

## OpenSpec Workflow

Use OpenSpec for every non-trivial change, including:

- Product behavior, user flows, business logic, AI behavior, prompts, or data
  models.
- Frontend screens, shared components, state management, routing, or API
  contracts.
- Authentication, permissions, payments, security, privacy, logging, analytics,
  or observability.
- Integrations with Douyin, commerce systems, AI providers, databases, queues,
  storage, or deployment platforms.
- Any change that introduces a dependency or touches multiple modules.

Tiny maintenance can skip OpenSpec only when it is low risk:

- Typos or wording fixes.
- Small documentation clarifications.
- Local non-behavioral formatting.
- Diagnostic commands.

Even tiny changes still require verification or a clear note explaining why no
verification applies.

Useful OpenSpec commands:

```bash
openspec list
openspec status --change <change-name>
openspec validate <change-name>
openspec show <change-name>
openspec archive <change-name>
```

### Autonomous Continuation

When the user asks to continue improving the project without a specific feature
request, agents must treat the AI continuous development goal as first-class
context. The expected loop is:

1. Read the goal document, the autonomous roadmap, accepted specs, rules, current
   worktree, and public preview state.
2. Pick the next smallest coherent wave that improves a real operator workflow
   or removes a prerequisite blocker.
3. Research unclear or time-sensitive assumptions using project docs, installed
   skills, official docs, or reliable public sources.
4. Create or update OpenSpec artifacts before non-trivial implementation.
5. Verify the affected surface and write durable learnings back to the goal,
   roadmap, contracts, specs, or docs.

User collaboration should be requested only when external account permissions,
credentials, business truth, sensitive data approval, or high-risk production
decisions cannot be resolved from the repository and reliable sources.

## Skill Usage

Use project-local and installed skills intentionally. Do not treat skills as
optional when their trigger applies.

### OpenSpec Skills

Use these for spec-driven project work:

- `openspec-explore`: use when thinking through requirements, architecture,
  risks, or trade-offs before implementation. Do not write production code in
  explore mode.
- `openspec-propose`: use when creating a new non-trivial change. It should
  produce proposal, design, specs, and tasks.
- `openspec-apply-change`: use when implementing tasks from an OpenSpec change.
  Read all context files first, implement tasks one by one, and mark completed
  tasks immediately.
- `openspec-archive-change`: use only after implementation and verification are
  complete.

### Product Discovery And Planning Skills

Use product-management skills to improve OpenSpec quality, not to replace
OpenSpec artifacts. When a PM skill produces framing, discovery notes, PRD
content, story maps, or roadmap decisions, fold the durable outcome into the
active `proposal.md`, `design.md`, `specs/**/spec.md`, and `tasks.md`.

Use these skills when the trigger applies:

- `product-strategy-session`: use for major product direction, workflow, or
  roadmap questions before committing to an implementation wave.
- `problem-framing-canvas` and `opportunity-solution-tree`: use when a request
  is still framed as a stakeholder solution, vague feature idea, or ambiguous
  operator pain. Clarify the problem before proposing screens or data models.
- `jobs-to-be-done`, `proto-persona`, `customer-journey-map`, and
  `discovery-process`: use when defining operator segments, live-commerce jobs,
  customer journeys, or discovery plans for badminton racket live-selling
  workflows.
- `discovery-interview-prep`: use before creating interview scripts or research
  plans for hosts, operators, team leads, or racket product specialists.
- `lean-ux-canvas`: use when the team needs assumptions, risks, and learning
  goals before building an MVP slice.
- `prd-development`: use for large initiatives that need engineering-ready
  requirements, then translate the PRD output into OpenSpec artifacts.
- `roadmap-planning` and `prioritization-advisor`: use when sequencing roadmap
  waves, choosing between competing feature investments, or explaining why a
  capability is in or out of scope.
- `epic-hypothesis`, `epic-breakdown-advisor`, `user-story-mapping`,
  `user-story`, and `user-story-splitting`: use when turning a validated
  workflow into epics, stories, acceptance criteria, and reviewable OpenSpec
  tasks.
- `pol-probe` and `pol-probe-advisor`: use when an AI, workflow, or market
  assumption should be tested cheaply before full implementation.
- `ai-shaped-readiness-advisor`, `context-engineering-advisor`, and
  `recommendation-canvas`: use for AI-product design questions, especially when
  deciding whether AI belongs in a workflow, how much context to provide, and
  how to validate recommendations.
- `positioning-statement`, `positioning-workshop`, `press-release`, and
  `storyboard`: use selectively for stakeholder alignment, product narrative,
  and demo storytelling. They do not replace implementation specs.

Do not use career, interview, executive-readiness, generic SaaS finance,
market-sizing, or growth-channel skills as default project workflow. Use them
only when the user explicitly asks for career coaching, business strategy,
pricing, acquisition, market sizing, or executive planning.

### UI/UX Skill

Use `ui-ux-pro-max` for frontend, visual design, UX review, dashboard, landing,
form, table, or component work.

Before designing or implementing UI, generate a design system recommendation:

```bash
python ~/.codex/skills/ui-ux-pro-max/scripts/search.py "<product type> <industry> <keywords>" --design-system -p "<Project Name>"
```

For persisted design guidance:

```bash
python ~/.codex/skills/ui-ux-pro-max/scripts/search.py "<query>" --design-system --persist -p "<Project Name>"
```

If a stack is known, also query stack guidance:

```bash
python ~/.codex/skills/ui-ux-pro-max/scripts/search.py "<keyword>" --stack <stack>
```

Do not copy recommendations blindly. Adapt them to the active OpenSpec and the
actual product workflow.

Use `frontend-design` when implementing or materially restyling frontend pages,
components, dashboards, or HTML/CSS layouts. Constrain its output to this
product's operational-tool expectations: dense, calm, efficient, Chinese
operator-facing, and not marketing-first. If `frontend-design` suggests a bold
visual direction that conflicts with the active OpenSpec, shadcn-compatible
baseline, accessibility, or the "Frontend Expectations" section below, follow
the project rules and adapt the design.

User-facing page copy must be operator-facing, concise, and actionable. Do not
put development notes, OpenSpec explanations, backend/AI/database plans,
implementation boundaries, or internal architecture narration into normal
product UI; keep those details in README, contracts, roadmap, specs, or
explicit internal/debug surfaces.

### Playwright Skill

Use `playwright` for browser verification, screenshots, snapshots, UI debugging,
console checks, and interaction testing.

The helper is configured as:

```bash
export CODEX_HOME="${CODEX_HOME:-$HOME/.codex}"
export PWCLI="$CODEX_HOME/skills/playwright/scripts/playwright_cli.sh"
```

Typical loop:

```bash
"$PWCLI" --session <name> open http://localhost:<port>
"$PWCLI" --session <name> snapshot
"$PWCLI" --session <name> click eX
"$PWCLI" --session <name> snapshot
"$PWCLI" --session <name> close
```

Always snapshot before using element refs such as `e12`. Close sessions when
verification is done.

### Code Review And Repository Skills

Use these skills for development quality gates:

- `codebase-recon`: use before working in an unfamiliar area, shared workflow,
  or risky refactor. Prefer it for hotspot and history orientation, then inspect
  nearby code directly.
- `brooks-review`: use for code-review requests, PR readiness checks,
  architecture-smell reviews, or maintainability feedback. Findings should cite
  concrete files and consequences.
- `gh-address-comments`: use when addressing GitHub review or issue comments on
  the current branch. Verify `gh` authentication before relying on it.
- `gh-fix-ci`: use when GitHub Actions checks fail and the user asks for CI
  diagnosis or repair. Fetch logs, summarize failure context, and implement only
  scoped fixes.
- `pr-review-ci-fix`: use only when the user wants automated GitHub/GitLab PR
  review or CI fix loops and the required Composio CLI setup is available. Do
  not introduce Composio as a project dependency just to use this skill.

Use `vercel-deploy` only when the user explicitly asks for deployment or a
preview URL. Deployment provider selection remains out of scope until an
OpenSpec change defines it.

## Code and Architecture Standards

Follow `.codex/rules/03-implementation-quality.md`. In particular:

- Prefer existing framework patterns once code exists.
- Keep edits minimal and scoped to the active request.
- Do not add dependencies for simple problems.
- Before adding a dependency, evaluate maintenance, license, runtime impact, and
  framework compatibility.
- Use typed interfaces or explicit schemas for shared, persisted, or AI-produced
  data.
- Separate prompts, model calls, validation, persistence, and UI rendering.
- Do not store AI output as authoritative truth unless the spec defines human
  approval or audit metadata.

When adding application code, define clear boundaries:

- UI layer: rendering, forms, navigation, accessibility, local interaction state.
- Domain layer: live-session, racket-product, talk-track, and operations logic.
- Data layer: persistence, migrations, repositories, external API clients.
- AI layer: prompts, model calls, schema validation, retries, fallback behavior.
- Integration layer: Douyin, commerce tools, storage, analytics, notifications.

Do not blur these boundaries for convenience. If a file starts handling multiple
layers, split it before it becomes difficult to test.

## Domain Model Guardrails

For badminton racket live-commerce features, preserve domain-specific language.
Do not flatten everything into generic "item", "content", or "record" models.

Important concepts may include:

- Racket model.
- Weight class.
- Balance point.
- Shaft stiffness.
- Recommended string tension.
- Player level.
- Play style.
- Price band.
- Selling point.
- Live session theme.
- Host.
- Product order.
- Customer questions.
- Objections.
- Talk tracks.
- Next-session actions.

When a feature touches these concepts, define the data shape explicitly in the
OpenSpec design and tests.

## Edge Cases To Handle Explicitly

Do not leave these as vague "error handling":

- Empty input, missing fields, and partially saved drafts.
- Very long live notes, transcripts, or customer-question lists.
- Mixed Chinese and English product names.
- Duplicate racket models or aliases for the same product.
- Ambiguous player-level descriptions.
- Conflicting AI suggestions.
- Malformed AI JSON or schema mismatches.
- AI timeout, refusal, rate limit, provider outage, or partial generation.
- Network failure during save, upload, or analysis.
- User refreshes or closes the page mid-flow.
- Re-running analysis on edited source input.
- Unauthorized access to another brand, team, tenant, or session.
- Sensitive business data appearing in logs, prompts, screenshots, or exports.
- Mobile viewport text overflow and desktop table density issues.

If a new feature introduces a new edge case category, add it to the OpenSpec
tasks and verification plan.

## Frontend Expectations

Operational tools should be dense, calm, and efficient. Build the actual tool as
the first screen; do not default to a marketing landing page unless requested.

Frontend work must cover:

- Loading, empty, error, success, saved, and disabled states.
- Keyboard focus and accessible labels.
- Desktop and mobile layout checks.
- Stable dimensions for repeated cards, tables, toolbars, and controls.
- No text overflow or incoherent overlap.
- Clear distinction between human-entered facts and AI-generated suggestions.
- Chinese operator-facing labels unless the active spec says otherwise.

Use Playwright for rendered UI verification when a dev server exists.

## Security and Data Handling

Follow `.codex/rules/05-security-data.md`.

Treat these as sensitive by default:

- Customer comments, chats, orders, addresses, phone numbers, and private
  messages.
- Live-commerce transcripts, operational notes, GMV, conversion data, pricing
  strategy, supplier details, and campaign performance.
- Prompt templates, AI outputs, and evaluation datasets tied to the business.

Rules:

- Never commit secrets, tokens, cookies, private keys, or service credentials.
- Redact secrets from logs, prompts, screenshots, examples, and final responses.
- Send only minimum necessary data to AI providers.
- Do not log raw transcripts, full prompts, or personal data unless the spec
  explicitly requires protected logging.
- Server-side authorization is required for protected data even when the UI hides
  controls.

## Verification Standard

Do not claim work is complete until fresh verification has run and output has
been observed.

Choose verification based on the change:

- Docs: read rendered/changed content for consistency and broken references.
- Specs: run `openspec validate <change-name>` when relevant.
- Frontend: run lint/type/build if available, start dev server, use Playwright
  snapshot and console checks.
- Backend/API: run unit/integration tests and exercise error paths.
- AI features: test realistic sample input, empty input, malformed model output,
  and long input behavior.
- Security/data changes: verify redaction, authorization, and logging behavior.

Final responses must include:

- What changed.
- Files touched.
- Verification commands and result.
- Skipped verification and reason, if any.
- Remaining risks or follow-up work.

## Working Tree Rules

- Do not revert user changes unless explicitly asked.
- Do not run destructive git commands such as `git reset --hard` or
  `git checkout --` unless explicitly requested.
- Avoid unrelated formatting churn.
- If generated artifacts are temporary, clean them up before final response.
- If the repository has unrelated untracked files, leave them alone.

## Keeping This File Current

Update `AGENTS.md` and `.codex/rules/` when the project adopts:

- A concrete app framework.
- A package manager or monorepo layout.
- Database, auth, storage, queue, analytics, or deployment infrastructure.
- AI provider, prompt versioning scheme, evaluation framework, or data-retention
  policy.
- New security or compliance requirements.

Use OpenSpec for substantial updates to these instructions.
