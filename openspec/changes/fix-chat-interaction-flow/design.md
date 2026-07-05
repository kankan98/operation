## Context

The production Chat audit exercised desktop and mobile flows with Playwright: empty submit, suggested prompts, Enter / Shift+Enter, streaming first messages, deep links, session search, pin, rename, delete, message actions, task drawers, reload, and cleanup.

The main conversation path now streams and renders assistant messages separately from user messages, but surrounding controls still have fragile behavior. Copy crashes on the HTTP deployment because `navigator.clipboard` is unavailable. Newly streamed sessions can remain untitled. Rename/delete rely on blocking browser dialogs. Mobile Chat still exposes the persistent application sidebar and duplicate hidden controls. Feedback and more-action buttons appear active without visible behavior.

There is already a focused uncommitted backend change that titles `/sessions/new/stream` sessions from the first message. This change should be incorporated into this OpenSpec repair set rather than discarded.

## Goals / Non-Goals

**Goals:**
- Make the audited Chat flows deterministic and testable on production-like HTTP.
- Keep new-session streaming state stable while URL and store state synchronize.
- Make generated sessions immediately identifiable in the session list and page title.
- Replace brittle native browser dialogs with in-app rename/delete dialogs.
- Make mobile Chat a single-column experience with reliable drawers and inactive panels removed from the interaction tree.
- Ensure visible message action buttons either work, expose state, or are hidden.
- Add automated coverage for the production regression paths found by Playwright.

**Non-Goals:**
- Redesign the entire Chat visual system.
- Add authentication, authorization, or multi-user ownership semantics.
- Implement full feedback analytics dashboards.
- Replace the SSE transport or the AI provider abstraction.
- Convert the whole app layout to a new navigation framework.

## Decisions

1. **Use a minimal stability repair instead of a visual redesign.**
   - Recommended approach: fix the exact broken interaction contracts around current components.
   - Alternative: rebuild Chat layout and controls from scratch. Rejected because it expands blast radius and is not needed to address the audited defects.
   - Alternative: patch only the copy crash. Rejected because session titles, dialogs, mobile drawers, and inert controls are part of the same user journey.

2. **Title streaming-created sessions synchronously from the first user message.**
   - The backend already creates the session before streaming starts. It can store a trimmed, length-limited title immediately.
   - AI-generated titles can still refine later conversations, but the first render must not depend on asynchronous title generation.

3. **Keep URL as the entry point while protecting in-flight streaming messages.**
   - URL changes continue to select sessions.
   - When a newly created stream returns its session ID, the frontend must avoid reloading database history over the in-memory user + assistant placeholder state.

4. **Use app-native dialogs for session rename and delete.**
   - Dialogs should be accessible React components with focus management, loading state, validation, cancel/confirm buttons, and API error display.
   - This replaces `prompt` and `confirm`, which block automation, cannot show async errors, and do not match the app UI.

5. **Treat mobile inactive regions as non-interactive.**
   - Below 768px, persistent global navigation must not remain visible in the Chat viewport.
   - Hidden desktop panels should not expose duplicate inputs/buttons to assistive tech or Playwright locators. Use conditional rendering where practical; otherwise use `inert`/`aria-hidden`.

6. **Make message actions honest.**
   - Copy must guard Clipboard API availability and fall back on HTTP.
   - Thumbs up/down should at least toggle visible local state and disable contradictory state; durable API persistence can be a later enhancement if no endpoint exists.
   - More actions should be hidden until there is a menu with real commands.

## Risks / Trade-offs

- [Risk] App-native dialogs touch shared UI patterns. -> Mitigation: keep them local to Chat session actions unless a suitable existing Modal can be reused directly.
- [Risk] Immediate titles based on user text may be less polished than AI titles. -> Mitigation: limit length and allow later AI/manual rename to replace them.
- [Risk] Hiding mobile navigation could affect other app pages. -> Mitigation: scope layout changes to the shared responsive rules already required by `main-navigation`, then verify key routes still load.
- [Risk] Feedback without backend persistence could be mistaken as durable. -> Mitigation: make it a local visual affordance only, or hide feedback buttons until persistence is implemented.

## Migration Plan

1. Add/update regression tests for failing behavior first.
2. Implement backend initial title generation for streaming-created sessions.
3. Implement frontend state guards for new-session streaming, empty submit, copy fallback, message action honesty, dialogs, and mobile drawer behavior.
4. Run focused Chat tests, backend chat API tests, frontend lint/build/test, and Playwright production-like interaction checks.
5. Deploy with the existing release/current symlink process. Rollback by switching `/opt/ai-operations/current` to the previous release and restarting `ai-operations` if verification fails.

## Open Questions

None. For this repair set, thumbs up/down may be local-only unless an existing feedback API is found during implementation.
