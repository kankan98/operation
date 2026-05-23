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
2. Write or update `proposal.md`, `design.md`, `specs/**/spec.md`, and `tasks.md`.
3. Validate the change with `openspec validate <change-name>`.
4. Implement tasks one by one.
5. Mark task checkboxes as soon as each task is complete.
6. Re-run relevant verification.
7. Archive the change only after implementation is complete and validated.

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
4. Research unclear or time-sensitive assumptions using project docs, installed
   skills, official documentation, or reliable public sources.
5. Create or update an OpenSpec change with scope, risks, tasks, and
   verification before implementation.
6. Implement the smallest coherent capability slice.
7. Verify locally and, when frontend behavior or public claims changed, verify
   the public preview.
8. Update the goal, roadmap, README, specs, or rules when the work changes the
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

## Git Commit Messages

- Commit messages MUST be written in Chinese for this repository.
- Keep messages concise and outcome-focused, for example `文档：补齐根目录 README`
  or `契约：定义球拍产品库边界`.

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
