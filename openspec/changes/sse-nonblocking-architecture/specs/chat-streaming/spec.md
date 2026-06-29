# Chat Streaming

## Purpose

定义聊天流式传输功能的需求变更，从两步流式模式迁移到单步 SSE 直连模式。

## MODIFIED Requirements

### Requirement: Stream creation endpoint
系统 SHALL 提供 GET 端点直接建立 SSE 连接，无需预先创建 stream。

#### Scenario: Direct GET SSE connection
- **WHEN** 客户端发送 GET /api/chat/sessions/:sessionId/stream?content=<message>
- **THEN** 系统 SHALL 立即返回 200 OK with Content-Type: text/event-stream

#### Scenario: Immediate response headers
- **WHEN** GET 请求到达后端
- **THEN** 系统 SHALL 在 10ms 内返回 SSE 响应头，保持连接打开

#### Scenario: Asynchronous message processing
- **WHEN** SSE 连接建立后
- **THEN** 系统 SHALL 在后台异步执行 chatService.streamMessage()，不阻塞响应

#### Scenario: URL parameter encoding
- **WHEN** 消息内容包含特殊字符
- **THEN** content 参数 SHALL 经过 encodeURIComponent() 编码

### Requirement: SSE connection endpoint
系统 SHALL 通过单一 GET 端点处理 SSE 连接，移除独立的 SSE 端点。

#### Scenario: Unified endpoint
- **WHEN** 客户端需要建立 SSE 连接
- **THEN** 使用 GET /api/chat/sessions/:sessionId/stream?content=xxx，而非分离的 /sse/:streamId

#### Scenario: No streamId needed
- **WHEN** 建立 SSE 连接
- **THEN** 系统 SHALL 不需要预先获取 streamId

#### Scenario: Session-based routing
- **WHEN** SSE 事件推送时
- **THEN** 系统 SHALL 直接通过当前 HTTP 响应流推送，无需查找 streamId 映射

### Requirement: Request body structure
系统 SHALL 接受 URL 查询参数而非 JSON body。

#### Scenario: Query parameter format
- **WHEN** 客户端发送消息
- **THEN** 消息内容 SHALL 作为 ?content=xxx 查询参数传递

#### Scenario: No request body
- **WHEN** 发送 GET /stream 请求
- **THEN** 请求 SHALL 不包含 request body

#### Scenario: Session ID in URL path
- **WHEN** 指定会话
- **THEN** sessionId SHALL 作为 URL 路径参数 /sessions/:sessionId/stream

### Requirement: Response structure
系统 SHALL 直接返回 SSE 事件流，而非 JSON 元数据。

#### Scenario: SSE event stream response
- **WHEN** GET /stream 请求成功
- **THEN** 响应 SHALL 是 text/event-stream 格式，而非 JSON

#### Scenario: No metadata response
- **WHEN** 连接建立
- **THEN** 系统 SHALL 不返回 streamId/messageId JSON，而是直接推送 message_start 事件

#### Scenario: MessageId in event payload
- **WHEN** 消息开始
- **THEN** messageId 和 sessionId SHALL 包含在 message_start 事件的 data 字段中

## REMOVED Requirements

### Requirement: Stream creation returns JSON metadata
**Reason**: 新架构下无需两步握手，直接建立 SSE 连接即开始推送事件
**Migration**: 前端移除 POST 请求和 JSON 解析逻辑，直接创建 EventSource

### Requirement: StreamManager in-memory storage
**Reason**: 单步 SSE 架构下，每个连接直接处理自己的 generator，无需全局管理器
**Migration**: 删除 backend/src/services/streamManager.ts，移除所有 streamManager 引用

### Requirement: Stream expiration after 5 minutes
**Reason**: 新架构无 stream 存储，连接由 HTTP 层管理，自动清理
**Migration**: 无需手动清理逻辑，依赖 HTTP 连接超时机制
