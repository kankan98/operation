## Context

Current state:

- `/sessions` can create, save, and submit V0 session captures in a local/internal team context.
- The AI review repository, execution service, provider port, and protected API routes already exist and are locally verified with fake-provider route checks.
- `/ai-review` still renders a static preview that says generation and persistence are unavailable.
- The local V0 bootstrap currently creates an operator membership without `run_ai_review`, so it cannot call AI review mutation routes.

External and skill-backed context:

- Douyin E-commerce Compass positions live-commerce diagnosis and after-live review as a core operations workflow, so connecting submitted sessions to review output is a better V0 accelerator than adding another isolated static surface.
- NIST AI RMF and OWASP LLM Top 10 support the existing project stance: AI suggestions must remain reviewable, source-aware, bounded, and redacted; browser UI must not expose raw prompts, provider payloads, secrets, session cookies, or private data.
- UI/UX skill output was adapted rather than copied. The search suggested a high-energy webinar pattern, which conflicts with this operational dashboard. The implementation will keep the existing calm, dense Chinese workbench style while preserving the useful accessibility guidance: visible loading/empty/error states, clear focus states, responsive checks, and no text overflow.
- Prioritization conclusion: this is a high-value, moderate-effort workflow slice because it reuses existing session capture and AI review API infrastructure while creating the first visible AI payoff in the V0 loop.

## Goals / Non-Goals

**Goals:**

- Make `/ai-review` usable after `/sessions` without adding production auth or RAG.
- Resolve local V0 team context, load submitted/review-ready session captures, and show an actionable empty state when none exist.
- Prepare AI review runs from selected session captures using bounded input snapshots and a local V0 knowledge snapshot.
- Execute V0 runs through a fake `AiProviderPort` path by default, so browser verification does not call DeepSeek or require provider credentials.
- Render run detail, output sections, validation results, and human review decisions in an operator-facing UI.
- Extend local V0 bootstrap permission only enough to support this internal workflow.
- Add repeatable local checks and documentation updates.

**Non-Goals:**

- No production login provider, public signup, middleware-wide route protection, team switching, or invitation flow.
- No live DeepSeek call from Playwright, route checks, or default V0 browser execution.
- No RAG retrieval, public web discovery, queue, object storage, analytics provider, or production deployment provider.
- No automatic publishing of AI output into authoritative knowledge, talk tracks, tasks, or short-video assets.
- No new npm dependency.

## Decisions

1. **Use the existing AI review API shape from the browser, with a local V0 fake-provider execute route.**
   - Rationale: `POST /api/ai-review/runs`, prompt metadata, detail, decisions, feedback, and archive already exist. The only browser-unfriendly gap is that the production execute route builds a DeepSeek provider from environment configuration.
   - Alternative considered: call the existing execute route directly. Rejected for V0 verification because it either requires live provider credentials or returns provider-config errors, so it does not prove the browser workflow.
   - Alternative considered: bypass the AI review API and render client-side fake output. Rejected because it would not validate the repository, execution service, provider port, or audit state.

2. **Add a local/internal fake-provider route instead of a provider flag on the production execute route.**
   - Rationale: a separate V0 route can be gated by the same bootstrap enablement and custom CSRF rules, keeping production execute behavior unchanged.
   - Alternative considered: query parameter such as `?provider=fake`. Rejected because provider selection in a production route is easier to misuse and harder to reason about in security review.

3. **Build snapshots in a client-side workflow helper but persist only through protected Route Handlers.**
   - Rationale: the browser already receives the selected session capture. The helper can map the visible session view into the bounded AI review input schema, while the server remains responsible for auth, scope, validation, execution, and persistence.
   - Alternative considered: server-side snapshot construction by session ID. Deferred because the existing AI review API contract already accepts snapshots and this wave should avoid new repository joins or service boundaries.

4. **Use a deterministic V0 knowledge snapshot with explicit source IDs.**
   - Rationale: the existing repository requires reviewed knowledge/source IDs to prevent AI review from running with no evidence. Until RAG and published knowledge snapshots are implemented, the V0 workflow will use clearly labeled local review baseline IDs and show them as review context, not as authoritative racket facts.
   - Alternative considered: mark knowledge insufficient and only show blocked state. Rejected because it would preserve the current "cannot generate" user experience.

5. **Grant local V0 operator AI review permission by permission override, not by redefining the global operator role.**
   - Rationale: this keeps production role semantics stable while allowing the internal V0 workflow to cross from capture into review.
   - Alternative considered: add `run_ai_review` to all `operator` roles. Rejected because that changes broader authorization behavior outside the V0 bootstrap.

6. **Keep UI action scope narrow: prepare, execute, inspect, accept/reject sections.**
   - Rationale: this completes the review loop without pretending that downstream talk-track/task workflows are ready.
   - Alternative considered: generate downstream artifacts immediately. Deferred because accepted sections can only become draft references until talk-track and next-action browser workflows exist.

## Risks / Trade-offs

- **Fake-provider output feels generic** -> Build deterministic suggestions from the bounded prompt/session payload and label them as V0 suggestions that require review.
- **V0 knowledge snapshot could be mistaken for real source grounding** -> Display it as "V0 复盘基线" and keep source IDs visible as review context, not verified racket facts.
- **Additional local route may expand attack surface** -> Gate it with V0 bootstrap enablement, existing auth cookie, explicit tenant/team scope, existing AI review CSRF header, and no-store safe JSON responses.
- **Secure cookies do not work as a full auth browser flow on raw HTTP public preview** -> Keep docs explicit: full authenticated V0 workflow is local or HTTPS; public HTTP preview verifies rendered pages but not a complete secure-cookie auth flow.
- **Creating prompt metadata per run can duplicate rows** -> Accept for V0 simplicity; future production prompt management can add list/reuse semantics under a separate OpenSpec.
- **User may expect direct DeepSeek after providing credentials** -> Keep DeepSeek adapter available through the existing provider port, but do not call live provider by default during V0 verification or without explicit environment configuration.

## Migration Plan

1. Add tests/checks that describe the V0 browser workflow and fail before implementation.
2. Extend local V0 bootstrap permission override and safe response shape.
3. Add local V0 fake-provider route and reusable deterministic provider helper.
4. Replace `/ai-review` static preview with the authenticated V0 workflow.
5. Update README, roadmap, and accepted specs through archive.
6. Verify OpenSpec, local route/workflow checks, lint, typecheck, build, and Playwright before archive.
7. After archive, commit with Conventional Commit, push, rebuild Docker, restart preview, and check public routes.

Rollback path:

- Remove the V0 execute route and UI calls; `/ai-review` can fall back to the previous static workbench.
- Revert the V0 permission override without changing global role policy.
- Existing AI review repository/API runtime remains valid because this wave only adds a browser workflow on top of it.

## Open Questions

- Full authenticated public preview still needs HTTPS or a production auth strategy; this wave documents the limitation and keeps the complete workflow local/internal.
- Production prompt version reuse, RAG grounding, and downstream artifact creation remain separate roadmap waves.
