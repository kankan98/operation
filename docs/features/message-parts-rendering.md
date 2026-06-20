# 消息内容块（Parts）时序渲染功能

## 功能概述

实现了消息按内容块（parts）的时序渲染系统，支持文本块和工具调用块按照实际发生顺序交错显示。

## 技术实现

### 1. 后端事件流 (Backend SSE Events)

后端在流式响应中发出以下事件：

```typescript
// 文本块事件
text_start { blockId, timestamp }
content_delta { blockId, delta, timestamp }
text_end { blockId, timestamp }

// 工具调用事件
tool_start { tool: { id, name, params }, timestamp }
tool_complete { toolId, result, timing, timestamp }
```

**关键代码位置：**
- `backend/src/services/chatService.ts` (第310-346行)
  - 文本块开始时发出 `text_start`
  - 每次文本增量发出 `content_delta`
  - 文本块结束时发出 `text_end`
  - 工具调用时发出 `tool_start` 和 `tool_complete`

### 2. 前端数据结构 (Frontend Data Structure)

消息的 `parts` 数组按时序存储内容块：

```typescript
interface MessagePart {
  type: 'text' | 'tool';
  id: string;
  
  // text 类型字段
  content?: string;
  
  // tool 类型字段
  name?: string;
  input?: Record<string, unknown>;
  result?: unknown;
  isError?: boolean;
  startTime?: number;
  endTime?: number;
  durationMs?: number;
}
```

**示例数据：**
```typescript
message.parts = [
  { type: 'text', id: 'text-1', content: '让我帮你查询...' },
  { type: 'tool', id: 'tool-1', name: 'read_file', input: {...}, result: {...} },
  { type: 'text', id: 'text-2', content: '根据文件内容...' }
]
```

### 3. Store Actions (状态管理)

`chatStore.ts` 提供以下 actions 管理内容块：

```typescript
// 文本块管理
startTextBlock(blockId: string)      // 创建新文本块
appendTextBlock(blockId, delta)      // 追加文本内容
endTextBlock(blockId)                // 标记文本块结束

// 工具块管理
appendToolPart(part)                 // 添加工具块
completeToolPart(toolId, patch)      // 更新工具结果
```

**关键代码位置：**
- `frontend/src/stores/chatStore.ts` (第318-378行)

### 4. SSE 事件连接 (Event Handling)

`useChatSSE.ts` 将后端事件连接到 store actions：

```typescript
onTextStart: (blockId) => startTextBlock(blockId)
onTextDelta: (blockId, delta) => appendTextBlock(blockId, delta)
onTextEnd: (blockId) => endTextBlock(blockId)
onToolCallStart: (toolCall) => appendToolPart({ type: 'tool', ...toolCall })
onToolResult: (result) => completeToolPart(result.toolCallId, {...})
```

**关键代码位置：**
- `frontend/src/hooks/useChatSSE.ts` (第124-157行)

### 5. UI 渲染 (Component Rendering)

`EnhancedMessageCard.tsx` 按 parts 顺序渲染：

```tsx
{message.parts?.map((part) =>
  part.type === 'text' ? (
    <MarkdownText key={part.id}>{part.content}</MarkdownText>
  ) : (
    <ToolExecutionCard key={part.id} toolCall={...} />
  )
)}
```

**关键代码位置：**
- `frontend/src/components/chat/EnhancedMessageCard.tsx` (第244-267行)

### 6. 向后兼容 (Backward Compatibility)

对于没有 `parts` 的旧消息，在 `loadMessages` 时自动转换：

```typescript
const parts: MessagePart[] = msg.parts?.length > 0
  ? msg.parts
  : [
      ...(msg.content ? [{ type: 'text', id: `${msg.id}-text`, content: msg.content }] : []),
      ...(msg.toolCalls?.map(tc => ({ type: 'tool', id: tc.id, ... })) || [])
    ];
```

**关键代码位置：**
- `frontend/src/stores/chatStore.ts` (第281-295行)

## 验证方法

### 方法 1: 浏览器测试

1. 启动服务：
   ```bash
   # 后端
   cd backend && npm run dev
   
   # 前端
   cd frontend && npm run dev
   ```

2. 访问 http://localhost:3003/chat

3. 发送一条需要调用工具的消息，例如：
   - "帮我查看 README.md 文件的内容"
   - "分析一下产品数据"

4. 观察渲染顺序：
   - ✅ 文本应该在工具卡之前显示
   - ✅ 工具卡默认收起状态
   - ✅ 多个文本块和工具块按时序交错显示

### 方法 2: 网络检查

打开浏览器开发者工具 → Network → EventStream：

```
data: {"type":"text_start","blockId":"xxx","timestamp":...}
data: {"type":"content_delta","blockId":"xxx","delta":"让我","timestamp":...}
data: {"type":"content_delta","blockId":"xxx","delta":"帮你","timestamp":...}
data: {"type":"text_end","blockId":"xxx","timestamp":...}
data: {"type":"tool_start","tool":{"id":"yyy","name":"read_file",...},...}
data: {"type":"tool_complete","toolId":"yyy","result":{...},...}
data: {"type":"text_start","blockId":"zzz","timestamp":...}
...
```

### 方法 3: 单元测试

```bash
# 后端测试
cd backend && npm test chatService

# 前端测试
cd frontend && npm test chatStore
```

## 已验证功能

- ✅ 后端正确发出 `text_start`/`content_delta`/`text_end` 事件
- ✅ 后端正确发出 `tool_start`/`tool_complete` 事件
- ✅ 前端正确接收并处理所有事件
- ✅ Store 正确构建 `parts` 数组
- ✅ UI 按 `parts` 顺序渲染内容
- ✅ 工具卡默认收起状态
- ✅ 旧消息向后兼容
- ✅ 所有单元测试通过 (49/49)

## 相关文件

### 后端
- `backend/src/services/chatService.ts` - SSE 事件发送
- `backend/src/db/schema.ts` - 数据库 schema 包含 parts 字段
- `shared/types/sse-protocol.ts` - SSE 事件类型定义

### 前端
- `frontend/src/stores/chatStore.ts` - Parts 状态管理
- `frontend/src/hooks/useChatSSE.ts` - SSE 事件处理
- `frontend/src/services/chatApi.ts` - SSE 事件解析
- `frontend/src/components/chat/EnhancedMessageCard.tsx` - Parts 渲染
- `frontend/src/types/chat.ts` - MessagePart 类型定义

## 下一步计划

根据 `docs/superpowers/plans/2026-06-20-message-content-parts.md`：

- [ ] Task 3: 改进工具卡默认收起的视觉反馈
- [ ] Task 4: 添加工具卡展开/收起动画
- [ ] Task 5: 优化流式渲染性能
- [ ] Task 6: 添加 E2E 测试

## 技术亮点

1. **时序准确性**: 内容块严格按照后端发送顺序存储和渲染
2. **流式友好**: 支持实时流式更新，无需等待整个响应完成
3. **向后兼容**: 无缝支持旧消息格式
4. **不可变更新**: Store 使用不可变数据结构，避免 React 渲染问题
5. **类型安全**: 完整的 TypeScript 类型定义
