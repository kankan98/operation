# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.1.0] - 2026-06-20

### Added

- Chat 工作台：会话分组、搜索、置顶、任务管理面板和工具执行双卡片同步。
- 任务管理 API：`GET /api/tasks/:sessionId`、`POST /api/tasks`、`PATCH /api/tasks/:id`。
- 会话扩展 API：`PATCH /api/chat/sessions/:id` 支持置顶、标签、标题和预览更新。
- Playwright E2E：覆盖新建会话、发送消息、工具执行卡、置顶、搜索、任务详情滚动、会话切换和响应式抽屉。
- 文档：Chat 用户手册、任务管理扩展指南、已知问题和限制。

### Changed

- `/chat` 已切换到 Chat；旧版 Chat 组件和 legacy 路由已清理。
- Chat 响应式布局改为基于 AppLayout `<main>` 的容器查询，避免固定面板在中等视口被裁切。
- 新会话改为首条消息懒创建，避免产生空壳会话。

### Fixed

- 后端 Zod 校验兼容多份 Zod 实例，避免 shared schema 校验错误误变为 500。
- 产品 `checkInterval` 校验与数据库默认值统一为小时范围。
- Alert `dataSnapshot` 兼容对象和 JSON 字符串。
- 后端 TypeScript build 中的路由参数、provider stream 类型和 scraper DOM 类型错误。

## [2.0.0] - 2026-06-16

### 🚨 Breaking Changes

**SSE Protocol v2.0 - 完全重写的流式聊天协议**

旧的单步流式模式已被弃用，替换为新的两步流式模式。前端和后端都需要更新。

#### 迁移指南

**后端迁移**:
- 旧端点：`GET /api/chat/sessions/:id/stream?content=xxx` (已标记为 deprecated)
- 新端点：`POST /api/chat/stream` + `GET /api/chat/streams/:streamId`

**前端迁移**:
1. 更新 `chatApi.streamMessage` 方法以使用两步流程
2. 更新事件处理器以处理新的事件类型
3. 移除状态推断和时序计算逻辑
4. 使用后端返回的 messageId 而不是前端生成的临时 ID

### Added

#### 核心功能
- ✅ **两步流式模式**: POST 创建 stream → GET 建立 SSE 连接
- ✅ **统一事件命名**: 所有事件使用标准后缀 (_start, _change, _delta, _complete, _occurred)
- ✅ **后端 ID 管理**: 所有 ID (messageId, sessionId, streamId, toolId) 由后端生成
- ✅ **显式状态追踪**: status_change 事件，前端无需推断状态
- ✅ **完整时序元数据**: 后端计算工具执行时间 (startTime, endTime, durationMs)
- ✅ **共享类型系统**: `shared/types/sse-protocol.ts` 前后端类型统一
- ✅ **Session 自动创建**: POST /stream 可不提供 sessionId，自动创建新会话
- ✅ **心跳机制**: 每 15 秒发送心跳保持连接活跃

#### 新 API 端点
- `POST /api/chat/stream` - 创建流式会话
- `GET /api/chat/streams/:streamId` - 建立 SSE 连接

#### 新服务
- `StreamManager` - 内存流管理器，5 分钟自动过期

#### 新事件类型
- `message_start` - 消息开始（包含 messageId, sessionId, model, streamId）
- `status_change` - 状态变更 (thinking/tool_calling/writing/idle)
- `content_delta` - 内容增量（替代 text_delta）
- `tool_start` - 工具开始（包含完整参数和 timestamp）
- `tool_complete` - 工具完成（包含 result 和完整 timing）
- `usage_complete` - Token 使用统计
- `message_complete` - 消息完成（替代 message_done）
- `error_occurred` - 错误发生（标准化错误码）

#### 错误码系统
- `INVALID_REQUEST` - 请求参数无效
- `SESSION_NOT_FOUND` - Session 不存在
- `STREAM_NOT_FOUND` - Stream 不存在或已过期
- `INTERNAL_ERROR` - 内部错误
- `AI_PROVIDER_ERROR` - AI 提供商错误
- `TOOL_EXECUTION_ERROR` - 工具执行错误
- `RATE_LIMIT_EXCEEDED` - 超过速率限制
- `STREAM_TIMEOUT` - 流式处理超时

### Changed

#### 后端
- **ChatService.streamMessage**: 重写以生成新的 SSEEvent 类型，接受 messageId 和 streamId 参数
- **executeTools**: 返回完整的时序信息 (startTime, endTime, durationMs)
- **类型系统**: 迁移通用类型到 `shared/types/sse-protocol.ts`

#### 前端
- **chatApi.streamMessage**: 重写为两步流程，简化事件处理
- **useChatSSE**: 移除状态推断、时序计算、临时 ID 生成逻辑
- **类型系统**: 从 shared 导入通用类型

### Removed

- **旧 SSE 端点**: `GET /api/chat/sessions/:id/stream` (标记为 deprecated)
- **前端状态推断**: 不再需要根据事件类型推断 agent 状态
- **前端时序计算**: 不再需要维护 toolStartTimes 和 toolEndTimes
- **临时 ID 生成**: 前端不再生成 `assistant-${Date.now()}` 临时 ID
- **streamMessageLegacy**: 删除旧的流式方法
- **shared/schemas/chat-events.ts**: 被 sse-protocol.ts 替代

### Documentation

- ✅ 更新 `docs/api/sse-streaming.md` - SSE Protocol v2.0 完整文档
- ✅ 更新 `docs/api/rest-api.md` - 新端点说明
- ✅ 更新 `backend/tests/fixtures/openapi.json` - OpenAPI 规范

### Technical Details

**架构改进**:
- 单一数据源：所有 ID 由后端生成
- 类型安全：前后端共享 TypeScript 类型
- 事件完整性：每个事件自包含，前端无需记忆上下文
- 简化前端：移除复杂的状态管理逻辑

**性能优化**:
- 内存管理：Stream 自动过期（5 分钟）
- 心跳机制：15 秒间隔保持连接
- 并发支持：无硬性限制，自动清理

**兼容性**:
- 数据库 schema 无变化
- 现有消息数据完全兼容
- 旧端点暂时保留，标记为 deprecated

## [1.0.0] - Previous

初始版本功能...

---

## 迁移建议

### 立即行动
1. 更新前端代码以使用新的 SSE Protocol v2.0
2. 测试所有聊天场景（简单对话、工具调用、错误处理）
3. 监控新端点的性能和错误率

### 后续清理
1. 在确认新协议稳定后，删除旧端点 `GET /sessions/:id/stream`
2. 更新所有客户端应用
3. 清理 deprecated 注释

---

有关详细的技术文档，请参阅：
- [SSE 流式协议文档](./docs/api/sse-streaming.md)
- [REST API 文档](./docs/api/rest-api.md)
- [OpenSpec 变更提案](./openspec/changes/sse-protocol-v2/proposal.md)
