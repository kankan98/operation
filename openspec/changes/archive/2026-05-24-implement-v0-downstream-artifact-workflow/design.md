## Context

The project now has:

- `/sessions` operator V0 capture workflow.
- `/ai-review` operator V0 review workflow with fake-provider execution and human section decisions.
- Protected local-only Route Handlers and repository checks for AI review downstream artifact references, talk-track assets, and next-session tasks.
- `/talk-tracks` and `/next-actions` still render placeholder workbench pages.

The V0 user problem is now a handoff gap: after an operator accepts a useful AI review section, they still cannot turn it into a reusable script or an assigned next-session task in the browser. The backend boundaries exist, so this wave should connect them through the UI rather than adding new data models or providers.

Technical stage: this remains stage 4/5 local-only workflow runtime using existing Route Handlers, local PostgreSQL, V0 bootstrap auth, and fake-provider AI review output. It does not introduce production auth, RAG, a queue, object storage, analytics, or live AI calls.

## Goals / Non-Goals

**Goals:**

- Reuse the local V0 auth context across `/ai-review`, `/talk-tracks`, and `/next-actions`.
- Grant the internal V0 operator only the downstream permissions needed for this loop through permission overrides.
- Let accepted AI review sections create downstream draft references before becoming talk-track assets or tasks.
- Make `/talk-tracks` a browser-usable list/create workbench for V0 talk-track assets.
- Make `/next-actions` a browser-usable list/create/progress workbench for V0 next-session tasks.
- Preserve traceability from downstream assets/tasks back to AI review run and section IDs where the source came from AI review.
- Keep user-facing UI concise, Chinese, operational, and clear about AI suggestions requiring human judgment.
- Add repeatable local checks and Playwright verification for desktop/mobile.

**Non-Goals:**

- No production login provider, public signup, team switching, invitation, middleware-wide route protection, or HTTPS strategy.
- No live DeepSeek call, RAG snapshot, public web discovery, queue, notifications, calendar, export, analytics, or external commerce platform integration.
- No automatic publication of talk-track assets or automatic closing of tasks.
- No new npm dependencies, SDKs, database tables, or migrations expected.
- No direct Server Action wrapper in this wave; existing protected Route Handlers remain the runtime boundary.

## Decisions

1. **Bundle talk-track and next-action browser workflows in one proposal.**
   - Rationale: both are the same operator job after AI review: convert accepted suggestions into reusable or actionable follow-up. They share auth scope, V0 context, accepted-section source mapping, protected API style, and Playwright verification.
   - Alternative considered: implement only `/talk-tracks`. Rejected because the AI review output already includes both `talk_track_candidate` and `next_session_action`, and splitting them would preserve a half-closed V0 loop.

2. **Use existing Route Handlers from the browser instead of adding Server Actions.**
   - Rationale: talk-track and next-action Route Handlers already enforce auth cookie, explicit tenant/team scope, CSRF, repository validation, no-store responses, and route checks. A Server Action wrapper would add another boundary without creating new V0 value.
   - Alternative considered: Server Actions for forms. Deferred because project route checks are stronger today and AGENTS requires preserving existing local helper APIs.

3. **Extend local V0 permission override, not global role policy.**
   - Rationale: the internal V0 operator needs `manage_talk_tracks` and `manage_next_tasks` to exercise the full browser loop, but broadening all `operator` role semantics would change authorization behavior outside the V0 bootstrap.
   - Alternative considered: changing `ROLE_PERMISSIONS.operator`. Rejected as too broad for an internal workflow.

4. **Create downstream references before actual downstream records when the source is an AI review section.**
   - Rationale: AI review repository already gates downstream artifacts on accepted or edited sections and marks the run `downstream_ready`. This creates audit continuity before the talk-track/task is persisted.
   - Alternative considered: directly create talk-track/task records and skip AI review downstream references. Rejected because it weakens source provenance and makes the accepted-section gate less visible.

5. **Map only accepted section types into specific artifacts.**
   - `talk_track_candidate` and `short_video_topic` can become talk-track assets. Short-video topics use asset type `short_video_hook`.
   - `next_session_action` can become next-session tasks.
   - Other sections remain reference context but do not directly create downstream records in this wave.
   - Rationale: limits automation to the output types whose intent matches the downstream domain and avoids turning generic recap/diagnosis into unsupported assets.

6. **Keep draft/review states explicit.**
   - Talk-track assets created from AI review remain draft/reviewable and are not automatically published.
   - Tasks created from AI review are assigned or draft-like active work, with source metadata and optional checklist items, but not automatically completed.
   - Rationale: matches NIST/OWASP risk posture and existing contracts: AI output is reviewable input, not authoritative business truth.

7. **Build shared browser workflow helpers only for stable cross-page concerns.**
   - Scope helpers, CSRF constants, safe error mapping, accepted-section filtering, and payload mapping are shared.
   - Page layout remains page-local unless duplication becomes meaningful after implementation.
   - Rationale: avoids over-abstracting UI while preventing three pages from inventing different API shapes.

## Risks / Trade-offs

- **Local V0 permissions expand internal capability** -> Only permission overrides for deterministic V0 membership change; global role policy remains unchanged.
- **AI section text may not be suitable as a final asset** -> Create draft/reviewable records and show concise operator edit fields before save; do not publish automatically.
- **Duplicate downstream records from repeated clicks** -> Reuse repository duplicate checks where available and disable buttons during requests; show safe duplicate/state messages.
- **Short-video topic stored as a talk-track asset may feel semantically mixed** -> Use existing talk-track asset type for short-video hook only as a V0 artifact until a dedicated short-video asset contract exists.
- **Browser flows depend on local Secure cookie behavior** -> Full authenticated flow remains local/HTTPS; public HTTP preview verifies rendered surfaces only.
- **Large page components can grow quickly** -> Extract shared downstream workflow types/helpers into `src/lib` and keep page components focused on rendering and interaction.

## Migration Plan

1. Add OpenSpec specs and tasks for the downstream V0 workflow.
2. Add local checks for V0 downstream permissions and route-level create/list/progress behavior.
3. Extend local V0 bootstrap permission overrides and response shape.
4. Add shared client workflow helper for downstream APIs and source mapping.
5. Replace `/talk-tracks` placeholder with browser list/create workflow.
6. Replace `/next-actions` placeholder with browser list/create/progress workflow.
7. Add `/ai-review` downstream actions for accepted eligible sections.
8. Update README and roadmap.
9. Verify OpenSpec, local route/workflow checks, lint, typecheck, build, and Playwright before archive.

Rollback path:

- Revert the V0 permission override additions.
- Restore `/talk-tracks` and `/next-actions` placeholder pages.
- Remove downstream actions from `/ai-review`.
- Existing repository/API runtime remains valid because this wave only adds browser workflows on top of accepted APIs.

## Open Questions

- Dedicated short-video asset modeling remains outside this wave; V0 uses talk-track `short_video_hook` assets.
- Production public trial still needs HTTPS and production auth strategy before authenticated browser workflows are reliable on the public IP.
- Future Server Actions may wrap the Route Handlers for progressive enhancement after this V0 loop proves value.
