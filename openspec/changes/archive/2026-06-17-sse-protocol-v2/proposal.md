## Why

当前的 SSE 流式聊天协议存在严重的架构问题：事件类型混乱（后端发送 `text`/`done`，前端期望 `text_delta`/`message_done`）、ID 管理分裂（前后端各自生成消息 ID）、状态需要前端推断、工具时序由前端计算。这导致维护困难、类型不安全、状态管理复杂。需要从 0 重新设计一个简单、可靠、类型统一的 SSE 协议。

## What Changes

- **BREAKING**: 废弃现有 `GET /api/chat/sessions/:id/stream?content=xxx` 端点
- **NEW**: 引入两步流式模式：`POST /api/chat/stream` 返回 streamId，再通过 `GET /api/chat/streams/:streamId` 建立 SSE 连接
- **NEW**: 统一事件命名规范（使用 `_start`/`_change`/`_delta`/`_complete`/`_occurred` 后缀）
- **NEW**: 后端生成并管理所有 ID（messageId, sessionId, streamId, toolId）
- **NEW**: 后端计算并发送完整时序信息（startTime, endTime, durationMs）
- **NEW**: 后端显式发送状态变更事件（thinking/tool_calling/writing/idle）
- **NEW**: 统一类型系统（shared/types/sse-protocol.ts），前后端共享同一套类型定义
- **NEW**: 标准化错误码系统（StreamErrorCode 枚举）
- **REMOVAL**: 删除 `backend/tests/fixtures/openapi.json` 中旧的 SSE 接口定义

## Capabilities

### New Capabilities
- `two-step-streaming`: 两步流式启动模式（POST 创建 stream，GET 建立 SSE 连接）
- `unified-event-protocol`: 统一的 SSE 事件协议（8 种事件类型，统一命名规范）
- `backend-id-management`: 后端集中管理所有 ID 生成和分配
- `explicit-state-tracking`: 显式状态变更事件，前端无需推断
- `complete-timing-metadata`: 完整的工具执行时序元数据（后端计算）
- `shared-type-system`: 跨前后端的共享类型系统
- `stream-manager`: 内存中的 Stream 生命周期管理器

### Modified Capabilities
- `chat-api`: 聊天 API 接口从单步流式改为两步流式，移除旧的 stream 端点

## Impact

**后端**:
- `backend/src/routes/chat.ts`: 移除旧的 `/sessions/:id/stream` 端点，新增 `POST /stream` 和 `GET /streams/:streamId`
- `backend/src/services/chatService.ts`: 重写 `streamMessage` 方法，适配新事件协议
- `backend/src/services/streamManager.ts`: 新增 StreamManager 服务（内存管理）
- `backend/src/types/chat.ts`: 删除，迁移到 shared

**前端**:
- `frontend/src/services/chatApi.ts`: 重写 `streamMessage` 方法，适配两步流程
- `frontend/src/hooks/useChatSSE.ts`: 简化事件处理逻辑，移除状态推断和时间计算
- `frontend/src/types/chat.ts`: 删除，改为导入 shared 类型

**共享**:
- `shared/types/sse-protocol.ts`: 新增，定义完整的 SSE 协议类型
- `shared/schemas/chat-events.ts`: 废弃或移除

**测试和文档**:
- `backend/tests/fixtures/openapi.json`: 移除旧的 SSE 接口定义
- `docs/api/sse-streaming.md`: 更新为新协议文档

**数据库**: 无影响（消息存储结构不变）

**外部依赖**: 无新增依赖
