# SSE 流式协议 v2.0

本文档描述了 SSE（Server-Sent Events）流式聊天协议 v2.0。

## 概述

SSE Protocol v2.0 采用**两步流式模式**：

1. **步骤 1**: `POST /api/chat/stream` - 创建流式会话，获取 streamId
2. **步骤 2**: `GET /api/chat/streams/:streamId` - 建立 SSE 连接，接收事件流

## 设计原则

- **单一数据源**: 所有 ID 由后端生成和管理
- **类型统一**: 前后端共享 TypeScript 类型定义
- **事件驱动**: 每个事件携带完整信息，前端无需推断
- **时序清晰**: 后端计算并发送完整的时序元数据
- **错误透明**: 标准化的错误码和错误信息

## API 端点

### POST /api/chat/stream

创建流式会话（两步流式模式 - 步骤 1）

**请求**:
```json
{
  "sessionId": "uuid-456",  // 可选：不提供则自动创建
  "content": "你好"
}
```

**响应** (202 Accepted):
```json
{
  "streamId": "stream-789",
  "messageId": "msg-123",
  "sessionId": "uuid-456"   // 可能是新创建的
}
```

---

### GET /api/chat/streams/:streamId

建立 SSE 连接（两步流式模式 - 步骤 2）

**响应头**:
```
Content-Type: text/event-stream
Cache-Control: no-cache
Connection: keep-alive
```

## SSE 事件类型

所有事件使用统一的命名后缀：`_start`, `_change`, `_delta`, `_complete`, `_occurred`

### 1. message_start - 消息开始

```json
{
  "type": "message_start",
  "messageId": "msg-123",
  "sessionId": "session-456",
  "timestamp": 1718552345678,
  "model": "gpt-4-turbo",
  "streamId": "stream-789"
}
```

### 2. status_change - 状态变更

```json
{
  "type": "status_change",
  "status": "thinking",
  "timestamp": 1718552345678
}
```

### 3. content_delta - 内容增量

```json
{
  "type": "content_delta",
  "delta": "你好",
  "timestamp": 1718552345678
}
```

### 4. tool_start - 工具开始

```json
{
  "type": "tool_start",
  "tool": {
    "id": "tool_abc123",
    "name": "search_products",
    "params": { ... }
  },
  "timestamp": 1718552345678
}
```

### 5. tool_complete - 工具完成

```json
{
  "type": "tool_complete",
  "toolId": "tool_abc123",
  "result": {
    "output": { ... },
    "isError": false
  },
  "timing": {
    "startTime": 1718552345678,
    "endTime": 1718552346234,
    "durationMs": 556
  },
  "timestamp": 1718552346234
}
```

### 6. usage_complete - Token 统计

```json
{
  "type": "usage_complete",
  "usage": {
    "inputTokens": 1234,
    "outputTokens": 567,
    "totalTokens": 1801
  },
  "timestamp": 1718552346234
}
```

### 7. message_complete - 消息完成

```json
{
  "type": "message_complete",
  "messageId": "msg-123",
  "timestamp": 1718552346234,
  "metadata": {
    "totalTokens": 1801,
    "toolCallsCount": 2,
    "durationMs": 2556
  }
}
```

### 8. error_occurred - 错误

```json
{
  "type": "error_occurred",
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "API rate limit exceeded",
    "retryable": true
  },
  "timestamp": 1718552346234
}
```

## 客户端示例

```typescript
// 步骤 1: 创建流
const { streamId, messageId, sessionId } = await fetch('/api/chat/stream', {
  method: 'POST',
  body: JSON.stringify({ content: '你好' })
}).then(r => r.json());

// 步骤 2: 连接 SSE
const es = new EventSource(`/api/chat/streams/${streamId}`);

es.addEventListener('message', (e) => {
  const event = JSON.parse(e.data);
  switch (event.type) {
    case 'content_delta':
      appendText(event.delta);
      break;
    case 'message_complete':
      es.close();
      break;
  }
});
```

## 与 v1.0 的区别

| 特性 | v1.0 | v2.0 |
|-----|------|------|
| 启动模式 | 单步 | 两步 |
| 事件命名 | 混乱 | 统一后缀 |
| ID 管理 | 前端生成 | 后端生成 |
| 状态 | 推断 | 显式发送 |
| 时序 | 前端计算 | 后端计算 |
