# SSE 流式 API

> **TL;DR**: 使用 Server-Sent Events 实现聊天流式响应。事件类型：start, processing, text, done, error。客户端用 EventSource 或 fetch 连接。

## 端点

```http
POST /api/chat/sessions/:id/stream
Content-Type: application/json

{
  "content": "用户消息"
}
```

## 事件类型

### start
```json
{"type": "start"}
```

### processing
```json
{"type": "processing"}
```

### text
```json
{"type": "text", "text": "流式文本块"}
```

### done
```json
{"type": "done"}
```

### error
```json
{"type": "error", "error": "错误消息"}
```

## 客户端示例

```typescript
const response = await fetch('/api/chat/sessions/123/stream', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ content: 'Hello' }),
});

const reader = response.body!.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  
  const chunk = decoder.decode(value);
  const lines = chunk.split('\n');
  
  for (const line of lines) {
    if (line.startsWith('data: ')) {
      const data = JSON.parse(line.slice(6));
      if (data.type === 'text') {
        console.log(data.text);
      }
    }
  }
}
```

## 注意事项

- ⚠️ 避免使用 for-await-of（tsx 环境问题）
- ✅ 使用手动 .next() 迭代
- ✅ 发送 keepalive ping 防止超时

详见 [STREAMING_FIX.md](../../backend/STREAMING_FIX.md)
