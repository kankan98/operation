## Context

当前 SSE 实现存在架构层面的问题：

**现状**：
- 单步流式模式：`GET /sessions/:id/stream?content=xxx`（URL 参数传递消息内容）
- 类型系统分裂：后端发送 `{type: "text"}`，前端期望 `text_delta`；后端发送 `done`，前端期望 `message_done`
- ID 管理混乱：前端生成临时 ID `assistant-${Date.now()}`，后端生成真实 ID，需要事后关联
- 状态推断：前端根据事件类型推断状态（收到 `tool_call` → 设为 `tool_calling`）
- 时序计算：前端维护 `toolStartTimes` 和 `toolEndTimes` 的 ref，手动计算耗时

**技术债务**：
- `shared/schemas/chat-events.ts` 定义了标准（SSEEvent），但后端实际发送的是 StreamChunk（不同类型）
- `backend/src/types/chat.ts` 和 `frontend/src/types/chat.ts` 各自定义类型，不一致
- 前端需要复杂的状态管理（`useChatStore` 中的 `toolStartTimes`, `toolEndTimes`, `currentMessageId`）

**约束**：
- 不能破坏数据库 schema（消息存储结构保持不变）
- 必须支持现有的工具系统（agentTools）
- 必须支持 Agent Loop（多轮工具调用）
- 浏览器 EventSource API 的限制（只支持 GET，只能通过 URL 传参）

## Goals / Non-Goals

**Goals:**
- 统一类型系统：前后端共享一套 TypeScript 类型定义
- 简化前端：移除状态推断、时序计算、临时 ID 管理
- 清晰的事件序列：每个事件携带完整信息，自包含
- 后端主导：所有 ID、时间戳、状态由后端生成和管理
- 可追踪性：引入 streamId，便于调试和监控
- 类型安全：完整的 TypeScript 类型定义，编译时检查

**Non-Goals:**
- 断点续传（连接断开后从头开始，不实现 Last-Event-ID）
- Stream 持久化（内存管理，消息完成后立即清理）
- WebSocket 支持（继续使用 SSE，不引入双向通信）
- 历史消息流式加载（只针对新消息的实时流式）

## Decisions

### 决策 1: 两步流式模式

**选择**：POST 创建 stream，GET 建立 SSE 连接

```
POST /api/chat/stream
  → { streamId, messageId, sessionId }

GET /api/chat/streams/:streamId
  → SSE stream
```

**理由**：
- POST 可以通过 body 传递消息内容（避免 URL 长度限制）
- 前端可以先获取 ID（messageId, sessionId），再建立 SSE 连接
- streamId 便于追踪和调试（日志、监控）
- 符合 RESTful 语义（POST 创建资源，GET 获取资源）

**备选方案**：
- 单步模式（当前）：`GET /sessions/:id/stream?content=xxx` - 被拒绝，因为 URL 参数传递消息不优雅，且难以管理 stream 生命周期

### 决策 2: 后端自动创建 Session

**选择**：`POST /api/chat/stream` 接受可选的 `sessionId`，如果不提供则自动创建

**理由**：
- 简化前端逻辑（不需要先调用 `POST /sessions`）
- 适合新对话场景（首次发送消息）
- 仍然支持指定 sessionId（适合已有会话）
- message_start 事件返回 sessionId，前端同步状态

**备选方案**：
- 前端主导：前端必须先创建 session - 被拒绝，因为增加前端复杂度，且新对话场景下是冗余的

### 决策 3: 统一事件命名后缀

**选择**：使用 `_start`, `_change`, `_delta`, `_complete`, `_occurred` 作为统一后缀

```
message_start      消息开始
status_change      状态变更
content_delta      内容增量
tool_start         工具开始
tool_complete      工具完成
usage_complete     统计完成
message_complete   消息完成
error_occurred     错误发生
```

**理由**：
- 一致性：所有事件类型一眼就能看出语义
- 可预测：开发者可以推断未见过的事件类型
- 避免混淆：`done` vs `message_done` vs `message_complete`，统一为 `_complete`

**备选方案**：
- 动词式（text_delta, message_done）：不一致，done 和 delta 不是同一个词性
- 名词式（message.start, content.delta）：增加了点号分隔符，不适合作为 TypeScript 字面量类型

### 决策 4: 工具参数不流式

**选择**：`tool_start` 事件包含完整的 `params` 对象

**理由**：
- 简单：不需要处理参数的流式累积
- 实际场景：工具参数通常不大（几 KB），AI 生成参数速度快
- 一致性：其他事件（usage_complete）也是一次性发送完整数据

**备选方案**：
- 流式参数：`tool_start` → `tool_param_delta` → `tool_complete` - 被拒绝，因为增加复杂度，实际收益有限

### 决策 5: 内存中的 Stream 管理

**选择**：StreamManager 在内存中维护 `Map<streamId, AsyncGenerator>`，不持久化

**理由**：
- 性能：内存读写比数据库快
- 简单：不需要序列化/反序列化 generator 状态
- 实际场景：Stream 生命周期短（几秒到几分钟），不需要跨进程恢复
- 自动清理：5 分钟后自动删除，避免内存泄漏

**备选方案**：
- 数据库持久化 + 断点续传 - 被拒绝，因为复杂度高，实际需求低（连接断开重新开始即可）

### 决策 6: 共享类型系统

**选择**：创建 `shared/types/sse-protocol.ts`，前后端都导入此文件

```typescript
// Backend
import { SSEEvent, MessageStartEvent } from '../../shared/types/sse-protocol';

// Frontend
import { SSEEvent, MessageStartEvent } from '../../../shared/types/sse-protocol';
```

**理由**：
- 单一数据源：类型定义只有一个地方，避免不一致
- 编译时检查：TypeScript 确保前后端使用相同的类型
- 易于维护：修改类型只需改一处

**备选方案**：
- 各自定义类型 - 被拒绝，当前就是这个问题
- OpenAPI 生成类型 - 部分采用（文档生成），但主要源还是 TypeScript

### 决策 7: 完整时序元数据由后端计算

**选择**：`tool_complete` 事件包含 `timing: { startTime, endTime, durationMs }`

**理由**：
- 准确性：后端测量的时间更准确（不受网络延迟影响）
- 简化前端：不需要维护 `toolStartTimes` ref
- 自包含：每个事件独立完整，前端无需记忆之前的事件

**备选方案**：
- 前端计算：`tool_start` 发送 startTime，前端记录，收到 `tool_result` 时计算 - 被拒绝，当前就是这个问题

## Risks / Trade-offs

### 风险 1: 两次 HTTP 请求延迟

**风险**：POST + GET 比单次 GET 增加了一次往返延迟（~50-200ms）

**缓解**：
- POST 立即返回（不等待 AI 响应），延迟可忽略
- GET 建立 SSE 连接也是立即的，真正的等待是 AI 响应（几秒）
- 实际影响：总延迟增加 < 100ms，用户无感知

### 风险 2: 内存泄漏（Stream 未清理）

**风险**：如果前端建立 SSE 连接后立即断开，generator 可能残留在内存中

**缓解**：
- 5 分钟自动清理（setTimeout）
- `message_complete` 或 `error_occurred` 后立即从 Map 中删除
- 监控：添加 metrics 追踪活跃 stream 数量

### 风险 3: StreamId 碰撞

**风险**：虽然概率极低，但 UUID 理论上可能重复

**缓解**：
- 使用 `crypto.randomUUID()`（UUID v4）
- 碰撞概率：10^-18 级别，实际不会发生
- 如果真的碰撞，旧 stream 会被覆盖（先到先得），用户重试即可

### 风险 4: Breaking Change 影响现有客户端

**风险**：旧前端代码无法连接新后端

**缓解**：
- 分阶段迁移：先部署后端（保留旧端点），再更新前端，最后删除旧端点
- 版本标识：新端点路径不同（`/stream` vs `/sessions/:id/stream`），互不干扰
- 回滚计划：如果出问题，回滚后端，旧端点仍然可用

### 权衡 1: 不支持断点续传

**权衡**：连接断开后需要重新开始（重新 POST）

**理由**：
- 实现成本高（需要缓存所有已发送事件，管理 Last-Event-ID）
- 实际需求低（聊天消息通常几秒内完成，断线重连场景少）
- 用户体验：重新生成消息（用户可能更倾向于这个行为）

### 权衡 2: 不支持并发 Stream（同一 session）

**权衡**：同一 session 同时只能有一个活跃 stream

**理由**：
- 消息顺序：并发会导致消息顺序混乱
- 上下文一致性：Agent Loop 依赖前一条消息的状态
- 实际需求低（用户不会同时发送两条消息）

## Migration Plan

### 阶段 1: 准备（不破坏现有功能）

1. 创建 `shared/types/sse-protocol.ts`（新文件）
2. 实现 `StreamManager`（新文件）
3. 添加新端点 `POST /api/chat/stream` 和 `GET /api/chat/streams/:streamId`
4. 保留旧端点 `GET /sessions/:id/stream`（标记为 deprecated）

**验证**：
- 旧前端仍然可以正常工作
- 新端点可以通过 Postman/curl 测试

### 阶段 2: 前端迁移

1. 更新 `frontend/src/services/chatApi.ts`，使用新端点
2. 简化 `useChatSSE`，移除状态推断和时序计算
3. 更新所有导入，从 `shared/types/sse-protocol` 导入类型

**验证**：
- E2E 测试通过
- 手动测试：发送消息、工具调用、错误处理

### 阶段 3: 清理

1. 删除旧端点 `GET /sessions/:id/stream`
2. 删除 `backend/src/types/chat.ts`（合并到 shared）
3. 删除 `frontend/src/types/chat.ts`（使用 shared）
4. 删除 `shared/schemas/chat-events.ts`（被 sse-protocol 替代）
5. 更新 `backend/tests/fixtures/openapi.json`，移除旧接口

**验证**：
- 所有测试通过
- 构建成功（无 TypeScript 错误）
- 文档已更新

### 回滚计划

如果新协议出现问题：

1. **前端回滚**：恢复旧的 `chatApi.streamMessage` 实现
2. **后端回滚**：保留旧端点（未删除），前端切回旧端点
3. **数据库无影响**：消息存储结构未变，无需数据迁移

## Open Questions

1. **心跳频率**：当前设计是 15 秒一次，是否需要可配置？
   - 建议：先固定 15 秒，根据生产环境监控调整

2. **Stream 过期时间**：当前设计是 5 分钟，是否足够？
   - 建议：5 分钟足够（正常消息 < 1 分钟），可通过环境变量配置

3. **工具结果大小限制**：如果工具返回超大数据（> 1MB），如何处理？
   - 建议：在 `executeTools` 中截断输出，添加 `truncated: true` 标识

4. **多 Session 并发**：是否需要限制同一用户的并发 stream 数量？
   - 建议：先不限制，监控后决定（如果滥用再加限流）
