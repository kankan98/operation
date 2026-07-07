## Context

`Chat` 在无 URL 会话 ID 时会把 `currentSessionId` 设为 `null`，并把该值传给 `TaskPanel`。`TaskPanel` 目前已经接收 `sessionId`，但渲染空任务状态时直接使用 `TaskOverviewEmpty` 的固定文案“当前会话还没有创建任务”。线上 `/chat` 复现显示，在用户尚未创建或选择会话时打开任务抽屉，会出现不准确的“当前会话”提示。

## Goals / Non-Goals

**Goals:**

- 在没有当前会话时，任务概览空态说明用户需要先发送消息创建会话。
- 在已有当前会话但没有任务时，保留现有“当前会话还没有创建任务”说明。
- 用组件测试和线上 Playwright 验证两种状态。

**Non-Goals:**

- 不改变任务加载条件：无 `sessionId` 时仍不请求任务 API。
- 不改变任务面板页签选择逻辑、工具执行空态或抽屉布局。
- 不新增任务创建入口。

## Decisions

- 给 `TaskOverviewEmpty` 增加 `hasSession` 布尔语义，由 `TaskPanel` 使用 `Boolean(sessionId)` 传入。
  - 推荐原因：`TaskPanel` 已经拥有 `sessionId`，空态组件只负责展示文案，数据边界清晰。
  - 替代方案 A：在无会话时隐藏任务面板。该方案会让用户失去对“任务会在哪里显示”的空间认知。
  - 替代方案 B：让任务 hook 提供空态原因。该方案会把纯 UI 文案问题扩展到数据层，不必要。
- 空态标题仍为“暂无任务”，辅助说明才区分上下文。
  - 原因：无会话状态下确实也没有任务，标题保持稳定，降低视觉变化。

## Risks / Trade-offs

- `TaskOverviewEmpty` 默认值若设置错误可能影响直接使用该组件的测试 -> 默认按已有会话处理，保持旧行为兼容。
- 文案变化只覆盖任务概览页签，工具执行空态仍为“暂无工具执行” -> 本轮不改工具执行，避免扩大范围。
- 如果未来支持草稿会话 ID，需要重新定义 `hasSession` -> 当前系统的 source of truth 是 `currentSessionId`，本轮按现状实现。
