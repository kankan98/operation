# 设计：聊天消息文本/工具时序分段（content parts）

- 日期：2026-06-20
- 分支：feature/chat-ui-redesign-v2
- 状态：设计已确认，待写实现计划

## 背景与问题

当前 SSE 流式协议中，文本只有 `content_delta`（无边界），后端把多轮文本拼成**一个 `content` 字符串**、工具调用放进 `toolCalls` 数组；前端 `EnhancedMessageCard` 先渲染整块 `content`、再在**下方**统一渲染所有工具卡。

由此产生两个问题：

1. **文本全部堆积在一个区域**——无论 AI 输出经历几段文本、几次工具调用，前端都呈现为"文本在上、工具在下"。
2. **时序丢失**——文本与工具调用的真实先后顺序无法还原；若 AI 先说一段、调用工具、再说一段，无法分段展示。

此外发现一个既有 bug：`chatService.streamMessage` 中 `finalToolCalls = iterationToolCalls`（赋值而非累加），导致**多轮 agent loop 只保留最后一轮的工具调用**。

## 目标

- 文本块拥有显式的开始/结束标识（`text_start` / `text_end`）。
- 消息内容按**真实时序**组织为有序的内容块序列（text / tool 交替）。
- 文本被工具调用打断时，自动分成多段，各段是独立的文本块。
- 分段结构**持久化**到数据库，历史会话重新打开时同样保持时序分段。
- 工具调用卡片**统一默认收起**，按需展开。

## 非目标 / 范围边界

- 不批量迁移数据库中的存量旧消息（读时兼容转换即可，当前库基本为空/测试期）。
- 不改变工具执行逻辑、AI provider 适配层、任务面板（task panel）逻辑。
- 不引入工具参数的流式传输（仍一次性发送完整参数，沿用现协议约定）。

## 设计

### 1. 数据结构（`shared/types/sse-protocol.ts` 与 `frontend/src/types/chat.ts`）

新增内容块类型：

```ts
export type MessagePart =
  | { type: 'text'; id: string; content: string }
  | {
      type: 'tool';
      id: string;
      name: string;
      input: Record<string, unknown>;
      result?: unknown;
      isError?: boolean;
      startTime?: number;
      endTime?: number;
      durationMs?: number;
    };
```

`ChatMessage` 新增 `parts` 字段（渲染优先使用），`content` 保留为纯文本拼接（复制/搜索/向后兼容）：

```ts
interface ChatMessage {
  // ...现有字段
  parts?: MessagePart[];   // 新增：有序内容块
  content: string;         // 保留：所有 text 块拼接
}
```

### 2. SSE 协议变更

新增两个事件，并为 `content_delta` 增加 `blockId`：

```ts
export interface TextStartEvent { type: 'text_start'; blockId: string; timestamp: number }
export interface TextEndEvent   { type: 'text_end';   blockId: string; timestamp: number }

export interface ContentDeltaEvent {
  type: 'content_delta';
  blockId: string;   // 新增：增量所属的文本块
  delta: string;
  timestamp: number;
}
```

两个新事件加入 `SSEEvent` 联合类型。`blockId` 为必填——前后端在同一版本一起发布，不存在新前端配旧后端的情况。

典型事件流（文本 → 工具 → 文本）：

```
message_start
text_start(b1) → content_delta(b1,…)… → text_end(b1)
tool_start(t1) → tool_complete(t1)
text_start(b2) → content_delta(b2,…)… → text_end(b2)
usage_complete → message_complete
```

### 3. 后端 `chatService.streamMessage` 改造

- 按序维护 `parts: MessagePart[]`。
- 每轮 agent loop 中：
  - 首个 text chunk 到来前：生成 `blockId`，`yield text_start`，新开一个 TextPart 压入 parts。
  - 每个 text chunk：累积到当前 TextPart.content，`yield content_delta(blockId, delta)`。
  - 遇到 tool_call：若有打开中的文本块，先 `yield text_end(blockId)` 收尾；将 ToolPart 压入 parts，走 `tool_start` → 执行 → `tool_complete`，并把 result/timing 回填到该 ToolPart。
  - 工具结束后继续循环；若下一轮再产文本，开**新**文本块（新 blockId）。
- 流结束前：若仍有打开的文本块，`yield text_end`。
- `content` 字段 = 所有 TextPart.content 拼接。
- **修复多轮工具 bug**：parts 按序累积天然包含所有轮次的文本与工具，替代原 `finalToolCalls` 赋值逻辑。

### 4. 存储与数据库

- `chat_messages` 增加列 `parts TEXT`（JSON 序列化的 `MessagePart[]`）。
- drizzle schema 增字段；生成迁移文件（`ALTER TABLE chat_messages ADD parts text;`）。
- `storeMessage` 扩展入参，序列化 parts 落库。
- `GET /api/chat/sessions/:id/messages` 解析 `parts` 字段返回；同时继续返回 `content`/`toolCalls`（兼容）。

### 5. 前端 store（`chatStore.ts`）与 `useChatSSE`

store 新增 actions（均作用于最后一条 assistant 消息的 `parts`）：

- `startTextBlock(blockId)`：向 `parts` 追加空 TextPart。
- `appendTextBlock(blockId, delta)`：定位该 blockId 的 TextPart 追加内容；**容错**：找不到则即时创建（防 text_start 丢失）。同步维护 `message.content`。
- `endTextBlock(blockId)`：标记文本块结束（边界用途）。
- `appendToolPart(toolCall)`：向 `parts` 追加 ToolPart。
- `completeToolPart(toolId, result)`：回填对应 ToolPart 的 result/timing/isError。

`chatApi.streamMessage` 的事件 switch 增加 `text_start` / `text_end` 分支；`content_delta` 按 `blockId` 路由到对应回调。`useChatSSE` 增加 `onTextStart` / `onTextEnd` handlers，并把工具事件改为操作 parts。

### 6. 前端渲染 `EnhancedMessageCard`

- 改为遍历 `message.parts` **按序渲染**：
  - `text` part → `ReactMarkdown` 渲染该段。
  - `tool` part → `ToolExecutionCard`。
- 流式光标/"正在生成"指示落在最后一个 text part。
- **工具卡默认收起**：`ToolExecutionCard` 的 `isExpanded` 初始值由 `true` 改为 `false`（收起态已支持，仅显示顶部信息行：图标 + 名称 + 状态 chip + 展开按钮）。运行中工具同样默认收起，状态由 chip 与旋转图标体现。
- **向后兼容**：消息无 `parts` 时回退到现有渲染（整块 `content` + 底部 `toolCalls`）。

### 7. 旧消息兼容

- 加载历史消息时，若该消息无 `parts`：由 `content` 合成单个 TextPart、由 `toolCalls` 合成 ToolParts，拼为 `parts` 供统一渲染。
- 读时转换，不写存量数据迁移。

## 测试策略

- **后端单测**（`chatService.test.ts`）：模拟"文本 → 工具 → 文本"的 provider 输出，断言事件序列（text_start/content_delta/text_end/tool_start/tool_complete 的顺序与 blockId）与最终 `parts` 结构正确；断言多轮工具调用全部保留。
- **前端单测**：`useChatSSE` 按 text_start/delta/end 构建正确的 parts；`EnhancedMessageCard` 按 parts 顺序渲染（文本段与工具卡交替）；工具卡默认收起。
- **端到端**（Playwright）：发送一条会触发工具穿插的消息，验证文本分两段、工具卡居中且默认收起、点击可展开。

## 关键取舍记录

- `content` 字段**保留**而非删除：作为纯文本兼容层，支撑复制、搜索与旧渲染回退。
- 旧消息采用**读时转换**而非 DB 迁移：当前数据库基本为空，迁移成本不划算。
- `content_delta` 的 `blockId` 设为**必填**：前后端同版本发布，无需兼容旧格式。
- 工具卡**统一默认收起**（含运行中）：列表更干净，贴合需求；放弃"运行中展开、完成收起"的动态行为以保持简单。
