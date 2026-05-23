# AI Development Rules

This directory contains the repository-local rules for AI-assisted development.
Future agents MUST read this file before making code, spec, data, or product changes.

## Rule Precedence

1. User instructions in the current conversation.
2. OpenSpec artifacts for the active change under `openspec/changes/<change>/`.
3. These repository rules in `.codex/rules/`.
4. Existing project code, tests, and conventions.
5. General model knowledge.

When rules conflict, pause and state the conflict instead of silently choosing.

## Read Order

For most tasks, read these files in order:

1. `01-workflow.md`
2. `02-ai-collaboration.md`
3. `03-implementation-quality.md`
4. `docs/engineering/code-architecture-standards.md` for non-trivial code,
   architecture, dependency, abstraction, or UI copy work
5. `04-verification-review.md`
6. `05-security-data.md`
7. `06-frontend-ai-product.md`

For tiny documentation or housekeeping changes, read `01-workflow.md` and the
specific rule file related to the task.

## Default Operating Contract

- Non-trivial changes MUST go through OpenSpec before implementation.
- Vibe coding is allowed only as bounded exploration, not as the final quality bar.
- Every completed task MUST include relevant verification or a clear reason why verification was not possible.
- Do not invent project architecture when local code, specs, or rules already define it.
- Keep changes scoped to the user's request and the active OpenSpec change.
- Before non-trivial coding, apply the decision gate in
  `03-implementation-quality.md` and the detailed standards in
  `docs/engineering/code-architecture-standards.md`.
- User-facing UI must not contain development notes, requirement text,
  OpenSpec explanations, implementation plans, or internal architecture
  narration.

## Current Application Baseline

- The first app lives at `apps/web`.
- The root workspace uses pnpm.
- The web stack is Next.js App Router, TypeScript, React, Tailwind CSS,
  shadcn/ui-compatible primitives, and lucide-react.
- Root scripts delegate to the web app for development, lint, type checking,
  and production build.
- Authentication, database, AI provider calls, seed knowledge ingestion,
  object storage, analytics, payments, and deployment provider configuration
  still require separate OpenSpec changes before implementation.

## Updating These Rules

Update this directory when the project adopts a new framework, database,
deployment target, AI provider, payment provider, analytics tool, or security
policy. Rule updates SHOULD be made through OpenSpec unless they are tiny wording
fixes.
