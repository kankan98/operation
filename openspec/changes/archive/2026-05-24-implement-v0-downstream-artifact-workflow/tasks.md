## 1. Proposal And Runtime Gates

- [x] 1.1 Validate the new OpenSpec change before implementation.
- [x] 1.2 Extend local V0 bootstrap permission override and verifier for `manage_talk_tracks` and `manage_next_tasks` without changing global role semantics.
- [x] 1.3 Add a rollback-based local V0 downstream workflow check covering permissions, CSRF, auth/scope, AI review downstream reference creation, talk-track draft creation, next-task creation, and safe redaction.

## 2. Shared Browser Workflow Helpers

- [x] 2.1 Add shared downstream client helpers for V0 scope, CSRF headers, API errors, safe status labels, accepted AI section filtering, and route-safe payload mapping.
- [x] 2.2 Add typed payload builders for AI-review-sourced talk-track assets, short-video hook assets, and next-session tasks.
- [x] 2.3 Keep manual draft payload builders separate from AI-sourced payload builders so UI copy can distinguish human input from AI suggestions.

## 3. Talk-Track Browser Workflow

- [x] 3.1 Replace `/talk-tracks` placeholder with a client workbench that resolves V0 context, lists scoped assets, shows empty/loading/error/saved states, and creates manual draft assets.
- [x] 3.2 Let `/talk-tracks` create draft assets from eligible accepted AI review sections while preserving source metadata and reviewable draft state.
- [x] 3.3 Preserve dense Chinese operator UX across desktop/mobile, disabled states, duplicate/error states, and review/source labels.

## 4. Next-Actions Browser Workflow

- [x] 4.1 Replace `/next-actions` placeholder with a client workbench that resolves V0 context, lists scoped tasks, shows empty/loading/error/saved states, and creates manual tasks.
- [x] 4.2 Let `/next-actions` create source-linked tasks from eligible accepted AI review sections while preserving source metadata, priority, owner, and checklist state.
- [x] 4.3 Support basic task progress through existing status/checklist routes and keep completion blockers visible.

## 5. AI Review Downstream Affordances

- [x] 5.1 Add `/ai-review` downstream actions for accepted talk-track, short-video, and next-task sections.
- [x] 5.2 Record AI review downstream artifact references before navigating or linking to downstream workbenches.
- [x] 5.3 Ensure pending/rejected/regeneration sections remain disabled for downstream creation.

## 6. Documentation And Verification

- [x] 6.1 Update README, app README, roadmap, and accepted-status notes to describe the V0 downstream browser workflow and local/HTTP preview boundary.
- [x] 6.2 Run OpenSpec validation, local auth/downstream/talk-track/next-action checks, lint, typecheck, build, and diff checks.
- [x] 6.3 Run Playwright desktop/mobile verification before archive, then archive the change, commit, push, rebuild/restart Docker, and check the public preview.
