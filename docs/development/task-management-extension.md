# 任务管理扩展指南

> **TL;DR**: 任务管理由后端 `task_overviews` 表、`/api/tasks` API、前端 `useTaskManagement` Hook 和 Chat 任务面板组成。扩展任务字段时，需要同步数据库 schema、Zod schema、共享类型、前端类型和 E2E/集成测试。

---

## 数据流

```text
SSE task_created/task_update/task_progress
  -> useChatSSE
  -> chatStore.taskOverviews
  -> useTaskManagement
  -> TaskPanel / TaskOverviewCard
```

会话切换时，`useTaskManagement` 会调用 `GET /api/tasks/:sessionId` 加载该会话任务。流式过程中，SSE 事件会实时更新 store 中的任务状态和进度。

---

## 后端扩展步骤

1. 更新数据库 schema：
   - `backend/src/db/schema.ts`
   - 必要时新增迁移和回滚脚本。

2. 更新任务类型和校验：
   - `backend/src/types/chat.ts`
   - `backend/src/schemas/task.schema.ts`
   - `shared/schemas/*` 中对应的 TS/JS schema。

3. 更新服务层：
   - `backend/src/services/taskService.ts`
   - 保持创建、查询、更新逻辑集中在 service。

4. 更新 API：
   - `backend/src/routes/tasks.ts`
   - 请求体必须经过 Zod middleware。

5. 更新文档：
   - `docs/api/chat-redesign-api.md`
   - `backend/tests/fixtures/openapi.json`

---

## 前端扩展步骤

1. 更新类型：
   - `frontend/src/types/chat.ts`

2. 更新 API client：
   - `frontend/src/services/taskApi.ts`

3. 更新状态管理：
   - `frontend/src/stores/chatStore.ts`
   - 如涉及 SSE，同步更新 `frontend/src/hooks/useChatSSE.ts`

4. 更新 UI：
   - `frontend/src/components/chat/TaskPanel.tsx`
   - `frontend/src/components/chat/TaskOverviewCard.tsx`

5. 更新测试：
   - 单元/组件测试放在 `frontend/tests/chat/`
   - 浏览器流程放在 `frontend/e2e/chat.spec.ts`

---

## 任务字段约定

稳定字段：

- `id`
- `sessionId`
- `taskName`
- `status`
- `startTime`
- `endTime`
- `relatedProducts`
- `platform`
- `metadata`

扩展字段优先放入 `metadata`，等产品语义稳定后再提升为一等字段。UI 需要滚动到关联消息时，可在 `metadata.messageId` 写入目标消息 id。

---

## 测试要求

后端至少覆盖：

- 创建任务默认值。
- 查询分页和过滤。
- 终态任务自动写入 `endTime`。
- 会话删除时任务级联删除。
- 验证失败和 404 错误。

前端至少覆盖：

- 任务状态、进度、平台、产品显示。
- 会话切换后任务面板刷新。
- SSE `task_created`、`task_update`、`task_progress`。
- 任务详情滚动目标。

E2E 使用 mock API 和 mock EventSource，避免依赖真实 AI provider。
