## Context

`TaskPanel` renders two tabs: "任务概览" and "工具执行". The component currently initializes `activeTab` to `tasks` unconditionally. Production sessions often contain tool calls from chat answers while the task API returns an empty list, so the panel shows an empty task state even though useful tool execution evidence is available one tab away.

The mobile/tablet task drawer reuses `TaskPanel`, so a component-level fix covers both desktop and responsive layouts.

## Goals / Non-Goals

**Goals:**
- Show the most relevant panel content by default when only tool executions exist.
- Switch to tool executions when they arrive asynchronously and no tasks exist.
- Preserve user intent after the user manually selects a tab.
- Keep the change local to `TaskPanel` with focused unit coverage.

**Non-Goals:**
- Changing chat SSE, backend task APIs, or persisted message formats.
- Rewriting task/tool card layout or styling.
- Adding new task records for tool-only chat interactions.

## Decisions

- Use a derived initial tab: `tasks.length === 0 && toolExecutions.length > 0 ? 'tools' : 'tasks'`. This preserves the current task-first behavior when tasks exist or when both tabs are empty, while surfacing available tool evidence in tool-only sessions.
- Track whether the user has manually selected a tab. An effect may auto-switch to `tools` only while the panel is still system-controlled. Once the user clicks either tab, future prop changes do not override their choice.
- Keep the logic in `TaskPanel` instead of duplicating it in `Chat` and `TaskPanelDrawer`. The drawer passes the same props and should inherit identical behavior.

## Risks / Trade-offs

- Auto-switching could surprise users if it fires after they start reading the task tab. Mitigation: only auto-switch before any manual tab click and only when tasks are empty.
- A session with both tasks and tools still defaults to tasks. This is intentional because task progress remains the primary right-panel summary when present.
