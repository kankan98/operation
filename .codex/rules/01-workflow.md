# Workflow Rules

## OpenSpec First

Use OpenSpec for any non-trivial change, including:

- Product behavior, user flows, business logic, AI behavior, prompts, or data models.
- Frontend screens, shared components, state management, routing, or API contracts.
- Authentication, permissions, payments, security, privacy, logging, or analytics.
- Integrations with Douyin, commerce platforms, AI providers, databases, queues, or storage.
- Changes that touch multiple modules or introduce a new dependency.

Required flow:

1. Create or continue an OpenSpec change.
2. Before finalizing requirements or proposal scope, run the pre-proposal
   research and value exploration gate below.
3. Write or update `proposal.md`, `design.md`, `specs/**/spec.md`, and `tasks.md`.
4. Validate the change with `openspec validate <change-name>`.
5. Implement tasks one by one.
6. Mark task checkboxes as soon as each task is complete.
7. Re-run relevant verification.
8. Run the relevant verification before archive, including Playwright browser
   checks when a rendered or public preview surface is in scope.
9. Archive the change only after implementation is complete and validated.
10. After archive, sync the completed work to the git remote and redeploy Docker.
11. Use a Conventional Commit message when committing:
    `type(scope): subject`.

Commit type must be a professional Conventional Commit prefix, such as `feat`,
`fix`, `docs`, `refactor`, `test`, `chore`, `perf`, `build`, `ci`, or `revert`.
Do not use vague prefixes such as "update" or "sync". Chinese subject text is
acceptable after the colon when it clearly describes the change.

## Pre-Proposal Research And Value Exploration

Every non-trivial requirements or proposal phase MUST begin with both:

- Reliable source research when the work depends on external, current,
  specialized, professional, platform, security, legal, AI, UX, or market
  knowledge. Prefer official, primary, standards-body, vendor, or professional
  sources. Record what was checked, why it is credible, and how it changed
  user value, scope, risk, or verification.
- Relevant skill-backed exploration before scope is locked. Choose skills that
  match the work, such as OpenSpec exploration for scope, product discovery
  skills for user value, UI/UX skills for screens, security or AI skills for
  risk-heavy work, and review or architecture skills for shared code changes.

The exploration MUST answer these product questions before implementation:

- Which target operator role benefits?
- Which live-commerce job or workflow improves?
- What current friction, risk, or waste is reduced?
- What result can the user achieve through the change?
- Is the idea aligned with the badminton live-commerce operations goal, or is it
  drifting into generic tooling?
- Is there a restrained product highlight that could exceed expectations
  without adding visual noise, cognitive load, accessibility risk, or code churn?
- What verification proves the user outcome and baseline quality?

Do not treat research as product truth by itself. Reusable business or domain
knowledge still needs source metadata, trust level, review status, versioning,
and refresh policy before it can ground AI answers or operator workflows.

## Autonomous Iteration Loop

When continuing project development without a narrowly specified task, use the
AI continuous development goal at
`docs/roadmap/ai-continuous-development-goal.md`, the project roadmap at
`docs/roadmap/autonomous-development-roadmap.md`, and accepted OpenSpec specs.

Default loop:

1. Read the AI continuous development goal to confirm target users, operator
   value, collaboration boundaries, research rules, and completion evidence.
2. Inspect current routes, specs, docs, code, verification output, and public
   preview state.
3. Identify the next operator-useful gap, such as product library, session
   capture, knowledge lifecycle, AI review, Q&A, talk tracks, or next actions.
4. Research unclear, external, or time-sensitive assumptions using project docs,
   installed skills, official documentation, professional sources, or reliable
   public sources.
5. Use relevant skills to test user value, goal alignment, scope, UX quality,
   feasibility, and whether the work can create a restrained product highlight.
6. Create or update an OpenSpec change with source notes, user-value framing,
   scope, risks, tasks, and verification before implementation.
7. Implement the smallest coherent capability slice.
8. Verify locally and, when frontend behavior or public claims changed, verify
   the public preview.
9. At the end of every development wave, review the whole project state before
   picking the next task: current routes, accepted specs, active/archive
   changes, docs, verification results, public preview state, known blockers,
   and whether the next candidate still matches the roadmap and operator value.
10. Run Playwright before archive when the change needs browser or public
    preview verification.
11. When an OpenSpec change is archived, sync the work to git and redeploy
    Docker.
12. Update the goal, roadmap, README, specs, or rules when the work changes the
    route or reveals a new durable constraint.

Do not treat the goal or roadmap as permission to bypass OpenSpec, security
rules, source review, or verification.

## Tiny Maintenance Exception

OpenSpec MAY be skipped only for tiny, low-risk work:

- Fixing typos or formatting in existing docs.
- Renaming a local variable without behavior change.
- Updating comments that do not alter behavior.
- Running a diagnostic command or answering a code question.

Even when OpenSpec is skipped, verification and final reporting still apply.

## Change Scope

- Keep implementation aligned with the active OpenSpec change.
- Do not add unrelated features, abstractions, packages, migrations, or UI redesigns.
- If implementation reveals that the spec is wrong or incomplete, update the OpenSpec artifacts before continuing.
- If the user changes direction, revise the active change rather than layering hidden assumptions into code.
- If development reveals business drift, weak user value, an unreasonable
  assumption, a conflict between rules, or a better smaller path, update the
  relevant OpenSpec artifact, contract, roadmap, rule, or task list before
  continuing implementation.
- Do not treat a proposal as frozen when newer implementation evidence,
  reliable source evidence, UX review, or direct user instruction shows the
  planned work no longer serves the target operator.

## Git Commit Messages

- Commit messages MUST use Conventional Commits in the form
  `type(scope): subject`.
- The type prefix MUST be a professional Conventional Commit prefix, such as
  `feat`, `fix`, `docs`, `refactor`, `test`, `chore`, `perf`, `build`, `ci`,
  or `revert`.
- Chinese subject text is acceptable after the colon when it clearly describes
  the outcome, for example `docs(workflow): 规范 git 提交消息格式`.
- Do not use vague prefixes such as "update" or "sync", and do not use bare
  Chinese descriptions without a Conventional Commit prefix.

## Completion Standard

A task is complete only when:

- The requested behavior is implemented.
- The relevant OpenSpec task is checked.
- Verification has been run or the blocker is documented.
- The final response explains what changed and what was verified.

## Useful Commands

```bash
openspec list
openspec status --change <change-name>
openspec validate <change-name>
openspec show <change-name>
openspec archive <change-name>
```
