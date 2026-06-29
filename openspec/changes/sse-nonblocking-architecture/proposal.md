## Why

当前 SSE (Server-Sent Events) 实现采用两步流式模式：先通过同步 POST 请求获取 streamId，再建立 SSE 连接。在 POST 阶段，后端执行工具调用（包括数据库查询，耗时 2-10 秒），导致前端主线程阻塞，用户无法切换页面、点击按钮或进行任何交互，严重影响用户体验。需要立即重构为非阻塞架构。

## What Changes

- **BREAKING**: 移除两步流式模式（POST + GET SSE），改为单步 GET 请求直接建立 SSE 连接
- **BREAKING**: 废弃 `POST /api/chat/sessions/:id/stream` 端点
- **BREAKING**: 废弃 `GET /api/chat/sse/:streamId` 端点
- **BREAKING**: 移除 `streamManager` 内存管理器及相关逻辑
- 新增 `GET /api/chat/sessions/:id/stream?content=<message>` 端点，立即返回 SSE 响应头，异步执行后台任务
- 前端 `chatApi.streamMessage()` 改为直接创建 EventSource，移除 axios POST 调用
- 优化后端工具执行：添加数据库查询索引，减少 `listProducts` 查询量（1000 → 100），指定必要字段避免 SELECT *
- 优化 `agentTools.ts` 中的数据聚合和过滤逻辑，减少内存占用

## Capabilities

### New Capabilities
- `sse-direct-connection`: SSE 直连架构，前端通过 GET 请求立即建立 SSE 连接，无需预先握手
- `database-query-optimization`: 数据库查询优化策略，包括索引优化、字段裁剪、查询量控制

### Modified Capabilities
- `chat-streaming`: 聊天流式传输的协议和端点发生根本性变更，从两步模式改为单步直连模式

## Impact

**前端影响**：
- `frontend/src/services/chatApi.ts`: 完全重写 `streamMessage()` 方法
- `frontend/src/hooks/useChatSSE.ts`: 调整错误处理和清理逻辑
- 所有调用 `chatApi.streamMessage()` 的组件需重新测试

**后端影响**：
- `backend/src/routes/chat.ts`: 移除两个端点，新增 GET SSE 端点
- `backend/src/services/streamManager.ts`: 完全移除
- `backend/src/services/chatService.ts`: 调整流式消息生成逻辑，适配新架构
- `backend/src/services/agentTools.ts`: 优化 `getAllProducts()` 和工具函数
- `backend/src/services/productService.ts`: 添加字段选择参数，优化查询

**数据库影响**：
- 需要为 `products` 表添加索引（如果尚未存在）
- 查询性能提升，减少全表扫描

**协议影响**：
- SSE 协议保持不变（事件类型和数据格式不变）
- 客户端连接方式改变（URL 和方法变更）
