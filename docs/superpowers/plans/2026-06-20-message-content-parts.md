# 聊天消息文本/工具时序分段（content parts）实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把聊天消息内容改为按时序排列的内容块（text/tool 交替），SSE 增加文本块 `text_start`/`text_end` 边界，前后端持久化并按序渲染，工具卡默认收起。

**Architecture:** 在 SSE 协议层新增文本块边界事件与 `blockId`；后端 `streamMessage` 按真实时序累积 `MessagePart[]` 并落库；前端 store 维护 `parts`，`EnhancedMessageCard` 按序渲染。`content` 字段保留作纯文本兼容层，旧消息读时转换。

**Tech Stack:** TypeScript、Express、drizzle-orm(better-sqlite3)、Zustand、React 19、vitest、@testing-library/react、Playwright。

**Spec:** `docs/superpowers/specs/2026-06-20-message-content-parts-design.md`

---

## 文件结构

| 文件 | 职责 | 改动 |
|------|------|------|
| `shared/types/sse-protocol.ts` | SSE 事件与共享类型 | 新增 `MessagePart`/`TextStartEvent`/`TextEndEvent`，`ContentDeltaEvent` 加 `blockId` |
| `backend/src/db/schema.ts` | drizzle 表结构 | `chatMessages` 加 `parts` 列 |
| `backend/drizzle/*` | 迁移 SQL | `db:generate` 生成 ADD parts |
| `backend/src/services/chatService.ts` | 流式生成 + 存取消息 | `streamMessage` 构建 parts + 边界事件；`storeMessage`/`getMessages` 读写 parts |
| `backend/src/routes/chat.ts` | 消息路由 | `GET …/messages` 返回 parts |
| `frontend/src/types/chat.ts` | 前端类型 | `MessagePart` + `ChatMessage.parts` |
| `frontend/src/stores/chatStore.ts` | 状态与 actions | 新增 parts 操作 actions + `loadMessages` 兼容合成 |
| `frontend/src/services/chatApi.ts` | SSE 事件分发 | 处理 `text_start`/`text_end`，`content_delta` 带 blockId |
| `frontend/src/hooks/useChatSSE.ts` | 流式回调 | 新增 `onTextStart`/`onTextEnd`，工具事件改为操作 parts |
| `frontend/src/components/chat/EnhancedMessageCard.tsx` | 消息渲染 | 按 parts 顺序渲染，旧消息回退 |
| `frontend/src/components/chat/ToolExecutionCard.tsx` | 工具卡 | 默认收起 |

---

## Task 1: 共享类型与 SSE 协议

**Files:**
- Modify: `shared/types/sse-protocol.ts`

- [ ] **Step 1: 新增 MessagePart 类型**

在 `shared/types/sse-protocol.ts` 的"基础类型"区（`TokenUsage` 之后）插入：

```ts
/**
 * 消息内容块（按时序排列的 text / tool 块）
 */
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

- [ ] **Step 2: 给 ContentDeltaEvent 增加 blockId**

把 `ContentDeltaEvent` 改为：

```ts
export interface ContentDeltaEvent {
  type: 'content_delta';
  blockId: string;       // 增量所属的文本块 ID
  delta: string;         // 文本增量
  timestamp: number;     // 事件时间戳
}
```

- [ ] **Step 3: 新增文本块边界事件**

在 `ContentDeltaEvent` 之后插入：

```ts
/**
 * 文本块开始 / 结束（与工具的 start/complete 对称，标记一段连续文本的边界）
 */
export interface TextStartEvent {
  type: 'text_start';
  blockId: string;
  timestamp: number;
}

export interface TextEndEvent {
  type: 'text_end';
  blockId: string;
  timestamp: number;
}
```

- [ ] **Step 4: 更新 SSEEvent 联合类型**

把 `SSEEvent` 联合类型补上两个新事件：

```ts
export type SSEEvent =
  | MessageStartEvent
  | StatusChangeEvent
  | ContentDeltaEvent
  | TextStartEvent
  | TextEndEvent
  | ToolStartEvent
  | ToolCompleteEvent
  | UsageCompleteEvent
  | MessageCompleteEvent
  | ErrorOccurredEvent
  | TaskCreatedEvent
  | TaskUpdateEvent
  | TaskProgressEvent
  | ToolExecutionDetailEvent;
```

- [ ] **Step 5: 编译验证**

Run: `cd backend && npx tsc --noEmit`
Expected: 出现关于 `content_delta` 缺少 `blockId` 的报错（chatService.ts / chat.ts 旧用法）——预期，将在 Task 4 修复。先确认 `sse-protocol.ts` 自身无语法错误（报错都指向消费方而非该文件）。

- [ ] **Step 6: Commit**

```bash
git add shared/types/sse-protocol.ts
git commit -m "feat(sse): 新增 MessagePart 与文本块边界事件 text_start/text_end"
```

---

## Task 2: 数据库 schema 与迁移

**Files:**
- Modify: `backend/src/db/schema.ts:93-104`
- Create: `backend/drizzle/<生成的迁移>.sql`

- [ ] **Step 1: chatMessages 增加 parts 列**

在 `backend/src/db/schema.ts` 的 `chatMessages` 定义中，`toolResults` 之后加一行：

```ts
export const chatMessages = sqliteTable('chat_messages', {
  id: text('id').primaryKey(),
  sessionId: text('session_id')
    .notNull()
    .references(() => chatSessions.id, { onDelete: 'cascade' }),
  role: text('role').notNull(),
  content: text('content').notNull(),
  toolCalls: text('tool_calls'),
  toolResults: text('tool_results'),
  parts: text('parts'),                // JSON 序列化的 MessagePart[]
  tokensUsed: integer('tokens_used'),
  timestamp: integer('timestamp').notNull(),
});
```

- [ ] **Step 2: 生成迁移**

Run: `cd backend && npm run db:generate`
Expected: 在 `backend/drizzle/` 生成新迁移文件，内容含 `ALTER TABLE \`chat_messages\` ADD \`parts\` text;`

- [ ] **Step 3: 应用迁移**

Run: `cd backend && npm run db:migrate`
Expected: 日志 `Database migrated successfully`，无报错。

- [ ] **Step 4: 验证列已存在**

Run:
```bash
cd backend && node -e "const D=require('better-sqlite3');const db=new D('./data/ecommerce.db',{readonly:true});console.log(db.prepare('PRAGMA table_info(chat_messages)').all().map(c=>c.name).join(','));db.close()"
```
Expected: 输出包含 `parts`。

- [ ] **Step 5: Commit**

```bash
git add backend/src/db/schema.ts backend/drizzle
git commit -m "feat(db): chat_messages 增加 parts 列存储内容块"
```

---

## Task 3: 后端 storeMessage / getMessages 支持 parts

**Files:**
- Modify: `backend/src/services/chatService.ts:502-564`
- Test: `backend/tests/chatService.test.ts`

- [ ] **Step 1: 写失败测试 —— storeMessage 持久化 parts、getMessages 读回**

在 `backend/tests/chatService.test.ts` 的 `describe('ChatService', …)` 内追加（`storeMessage`/`getMessages` 为私有，用类型断言访问）：

```ts
describe('parts 持久化', () => {
  it('storeMessage 写入 parts，getMessages 读回相同结构', async () => {
    const sessionId = await seedSession();
    const svc = chatService as unknown as {
      storeMessage(d: {
        sessionId: string; role: 'user' | 'assistant'; content: string;
        parts?: import('../../shared/types/sse-protocol').MessagePart[];
      }): Promise<{ id: string }>;
      getMessages(sessionId: string): Promise<Array<{ parts?: unknown }>>;
    };

    await svc.storeMessage({
      sessionId,
      role: 'assistant',
      content: 'hello world',
      parts: [
        { type: 'text', id: 'b1', content: 'hello ' },
        { type: 'tool', id: 't1', name: 'searchProducts', input: { q: 'x' }, result: { ok: true }, isError: false, durationMs: 12 },
        { type: 'text', id: 'b2', content: 'world' },
      ],
    });

    const msgs = await svc.getMessages(sessionId);
    expect(msgs).toHaveLength(1);
    expect(msgs[0].parts).toEqual([
      { type: 'text', id: 'b1', content: 'hello ' },
      { type: 'tool', id: 't1', name: 'searchProducts', input: { q: 'x' }, result: { ok: true }, isError: false, durationMs: 12 },
      { type: 'text', id: 'b2', content: 'world' },
    ]);
  });
});
```

- [ ] **Step 2: 跑测试确认失败**

Run: `cd backend && npx vitest run tests/chatService.test.ts -t "parts 持久化"`
Expected: FAIL —— `getMessages` 返回的对象无 `parts` 字段（`undefined !== [...]`）。

- [ ] **Step 3: 给 ChatService 引入 MessagePart 类型**

在 `backend/src/services/chatService.ts` 顶部已有的类型导入处，从 sse-protocol 引入 `MessagePart`（与现有 SSE 事件导入合并）：

```ts
import type { MessagePart } from '../../../shared/types/sse-protocol';
```

> 若文件已从 `../../../shared/types/sse-protocol` 导入其它类型，则把 `MessagePart` 加进同一条 import。

- [ ] **Step 4: storeMessage 写入 parts**

把 `storeMessage`（`chatService.ts:502-534`）改为：

```ts
  private async storeMessage(data: {
    sessionId: string;
    role: 'user' | 'assistant';
    content: string;
    toolCalls?: ToolCall[];
    toolResults?: ToolResult[];
    parts?: MessagePart[];
    tokensUsed?: number;
  }): Promise<ChatMessage> {
    const id = randomUUID();
    const timestamp = Date.now();

    await db.insert(chatMessages).values({
      id,
      sessionId: data.sessionId,
      role: data.role,
      content: data.content,
      toolCalls: data.toolCalls ? JSON.stringify(data.toolCalls) : null,
      toolResults: data.toolResults ? JSON.stringify(data.toolResults) : null,
      parts: data.parts ? JSON.stringify(data.parts) : null,
      tokensUsed: data.tokensUsed || null,
      timestamp,
    });

    return {
      id,
      sessionId: data.sessionId,
      role: data.role,
      content: data.content,
      toolCalls: data.toolCalls,
      toolResults: data.toolResults,
      parts: data.parts,
      tokensUsed: data.tokensUsed,
      timestamp,
    };
  }
```

- [ ] **Step 5: getMessages 读回 parts**

把 `getMessages`（`chatService.ts:554-563`）的 `.map` 返回对象增加 `parts` 解析：

```ts
    return rows.reverse().map(row => ({
      id: row.id,
      sessionId: row.sessionId,
      role: row.role as 'user' | 'assistant',
      content: row.content,
      toolCalls: row.toolCalls ? JSON.parse(row.toolCalls) as ToolCall[] : undefined,
      toolResults: row.toolResults ? JSON.parse(row.toolResults) as ToolResult[] : undefined,
      parts: row.parts ? JSON.parse(row.parts) as MessagePart[] : undefined,
      tokensUsed: row.tokensUsed || undefined,
      timestamp: row.timestamp,
    }));
```

- [ ] **Step 6: 给后端 ChatMessage 类型加 parts**

`ChatMessage` 定义在 `backend/src/types/chat.ts:22`（`chatService.ts:3` 从 `../types/chat` 导入）。在 `backend/src/types/chat.ts` 顶部加导入：

```ts
import type { MessagePart } from '../../../shared/types/sse-protocol';
```

并给 `ChatMessage` 接口加字段（`toolResults` 之后）：

```ts
export interface ChatMessage {
  id: string;
  sessionId: string;
  role: 'user' | 'assistant';
  content: string;
  toolCalls?: ToolCall[];
  toolResults?: ToolResult[];
  parts?: MessagePart[];
  tokensUsed?: number;
  timestamp: number;
}
```

- [ ] **Step 7: 跑测试确认通过**

Run: `cd backend && npx vitest run tests/chatService.test.ts -t "parts 持久化"`
Expected: PASS

- [ ] **Step 8: Commit**

```bash
git add backend/src/services/chatService.ts backend/src/types/chat.ts backend/tests/chatService.test.ts
git commit -m "feat(chat): storeMessage/getMessages 读写消息 parts"
```

---

## Task 4: 后端 streamMessage 按序构建 parts 与边界事件

**Files:**
- Modify: `backend/src/services/chatService.ts:206-421`
- Modify: `backend/src/routes/chat.ts`（content_delta 已由后端 emit，需补 blockId —— 见 Step 7）
- Test: `backend/tests/chatService.test.ts`

- [ ] **Step 1: 写失败测试 —— 文本→工具→文本 的事件序列与 parts**

在 `backend/tests/chatService.test.ts` 追加：

```ts
describe('streamMessage 时序分段', () => {
  it('文本→工具→文本：发出 text_start/text_end 边界且 parts 按序', async () => {
    const sessionId = await seedSession();

    // 第一轮：先文本，再一个工具调用
    mockStreamMessage.mockReturnValueOnce(streamOf([
      { type: 'text', text: '先说一段。' },
      { type: 'tool_call', toolCall: { id: 't1', name: 'searchProducts', input: { q: 'a' } } },
      { type: 'usage', usage: { inputTokens: 3, outputTokens: 4 } },
    ]));
    // 第二轮：工具结果回灌后，继续输出文本（无新工具 → 结束）
    mockStreamMessage.mockReturnValueOnce(streamOf([
      { type: 'text', text: '再说一段。' },
      { type: 'usage', usage: { inputTokens: 2, outputTokens: 2 } },
    ]));

    const events: Array<{ type: string; blockId?: string }> = [];
    for await (const e of chatService.streamMessage(sessionId, 'm1', 's1', '你好')) {
      events.push(e as { type: string; blockId?: string });
    }

    const types = events.map(e => e.type);
    // 关键顺序：text_start → content_delta → text_end → tool_start → tool_complete → text_start → content_delta → text_end
    expect(types).toEqual([
      'message_start',
      'status_change',          // thinking
      'status_change',          // writing（首个文本前）
      'text_start',
      'content_delta',
      'text_end',
      'status_change',          // tool_calling
      'tool_start',
      'tool_complete',
      'status_change',          // back to writing
      'text_start',
      'content_delta',
      'text_end',
      'usage_complete',
      'message_complete',
    ]);

    // 两个文本块 blockId 不同
    const starts = events.filter(e => e.type === 'text_start');
    expect(starts).toHaveLength(2);
    expect(starts[0].blockId).not.toEqual(starts[1].blockId);

    // 落库的 parts 按序为 text/tool/text
    const stored = await getStoredMessages(sessionId);
    const assistant = stored.find(m => m.role === 'assistant')!;
    const parts = JSON.parse(assistant.parts as string);
    expect(parts.map((p: { type: string }) => p.type)).toEqual(['text', 'tool', 'text']);
    expect(parts[0].content).toBe('先说一段。');
    expect(parts[1]).toMatchObject({ type: 'tool', name: 'searchProducts' });
    expect(parts[2].content).toBe('再说一段。');
  });

  it('多轮工具调用全部保留（修复 finalToolCalls 覆盖 bug）', async () => {
    const sessionId = await seedSession();
    mockStreamMessage.mockReturnValueOnce(streamOf([
      { type: 'tool_call', toolCall: { id: 't1', name: 'searchProducts', input: {} } },
    ]));
    mockStreamMessage.mockReturnValueOnce(streamOf([
      { type: 'tool_call', toolCall: { id: 't2', name: 'analyzeData', input: {} } },
    ]));
    mockStreamMessage.mockReturnValueOnce(streamOf([
      { type: 'text', text: '完成。' },
    ]));

    for await (const _e of chatService.streamMessage(sessionId, 'm1', 's1', 'go')) { void _e; }

    const stored = await getStoredMessages(sessionId);
    const assistant = stored.find(m => m.role === 'assistant')!;
    const parts = JSON.parse(assistant.parts as string);
    const toolNames = parts.filter((p: { type: string }) => p.type === 'tool').map((p: { name: string }) => p.name);
    expect(toolNames).toEqual(['searchProducts', 'analyzeData']);
  });
});
```

> 说明：`executeTools` 会真实调用 `executeToolWithParams`。`searchProducts`/`analyzeData` 在空库下应返回结果或受控错误而不抛出（与现有测试一致）。若某工具在空库抛错，断言仍成立——它会进入 `isError` 工具块，`type` 仍为 `tool`。

- [ ] **Step 2: 跑测试确认失败**

Run: `cd backend && npx vitest run tests/chatService.test.ts -t "时序分段"`
Expected: FAIL —— 当前无 `text_start`/`text_end` 事件，`parts` 列为 null。

- [ ] **Step 3: 在 streamMessage 内引入 parts 累积器与文本块助手**

在 `streamMessage` 的 `try {` 之后（`chatService.ts:206` 附近，`let context = …` 之前）插入：

```ts
      const parts: MessagePart[] = [];
      let openTextBlockId: string | null = null;

      // 打开一个文本块并返回其 blockId（调用方负责 yield text_start）
      const ensureTextBlockOpen = (): string => {
        if (openTextBlockId) return openTextBlockId;
        const blockId = randomUUID();
        openTextBlockId = blockId;
        parts.push({ type: 'text', id: blockId, content: '' });
        return blockId;
      };
      // 关闭当前文本块（调用方负责 yield text_end）
      const closeTextBlock = (): string | null => {
        const id = openTextBlockId;
        openTextBlockId = null;
        return id;
      };
      // 把增量写入当前文本块
      const appendToOpenText = (delta: string): void => {
        const p = parts[parts.length - 1];
        if (p && p.type === 'text' && p.id === openTextBlockId) {
          p.content += delta;
        }
      };
```

- [ ] **Step 4: 文本 chunk 改为带边界 + blockId**

把循环内"text chunk"分支（`chatService.ts:266-285` 的 `else if (chunk.type === 'text' && chunk.text) { … }`）替换为：

```ts
          } else if (chunk.type === 'text' && chunk.text) {
            // 首个文本：先切到 writing，再开文本块
            if (!hasStartedWriting) {
              hasStartedWriting = true;
              const writingStatus: StatusChangeEvent = {
                type: 'status_change',
                status: 'writing',
                timestamp: Date.now(),
              };
              yield writingStatus;
            }

            // 若当前没有打开的文本块，开一个并发 text_start
            if (!openTextBlockId) {
              const blockId = ensureTextBlockOpen();
              const textStart: TextStartEvent = {
                type: 'text_start',
                blockId,
                timestamp: Date.now(),
              };
              yield textStart;
            }

            appendToOpenText(chunk.text);

            const contentEvent: ContentDeltaEvent = {
              type: 'content_delta',
              blockId: openTextBlockId as string,
              delta: chunk.text,
              timestamp: Date.now(),
            };
            yield contentEvent;
          }
```

- [ ] **Step 5: 工具调用前先收尾文本块**

把循环内"tool_call"分支开头（`chatService.ts:238` 的 `if (chunk.type === 'tool_call' && chunk.toolCall) {` 之后、`const toolStartTime` 之前）插入收尾逻辑：

```ts
          if (chunk.type === 'tool_call' && chunk.toolCall) {
            // 工具会打断文本：先收尾当前文本块
            if (openTextBlockId) {
              const endedId = closeTextBlock() as string;
              const textEnd: TextEndEvent = {
                type: 'text_end',
                blockId: endedId,
                timestamp: Date.now(),
              };
              yield textEnd;
            }

            const toolStartTime = Date.now();
            // …（保留原有 toolCallWithId / iterationToolCalls.push / status_change / tool_start 逻辑）
```

- [ ] **Step 6: 工具执行后把工具块按序写入 parts，并在 tool_complete 时回填**

把循环结束后的工具执行段（`chatService.ts:307-326`，`const toolResults = await this.executeTools(...)` 与 `for (const toolResult of toolResults) { … yield toolCompleteEvent }`）替换为：

```ts
        // Execute tools and emit tool_complete events
        const toolResults = await this.executeTools(iterationToolCalls);

        for (const toolResult of toolResults) {
          const call = iterationToolCalls.find(c => c.id === toolResult.toolCallId);
          // 按时序把工具块压入 parts
          parts.push({
            type: 'tool',
            id: toolResult.toolCallId,
            name: call?.name ?? 'unknown',
            input: (call?.input ?? {}) as Record<string, unknown>,
            result: toolResult.output,
            isError: toolResult.isError || false,
            startTime: toolResult.startTime,
            endTime: toolResult.endTime,
            durationMs: toolResult.durationMs,
          });

          const toolCompleteEvent: ToolCompleteEvent = {
            type: 'tool_complete',
            toolId: toolResult.toolCallId,
            result: {
              output: toolResult.output,
              isError: toolResult.isError || false,
            },
            timing: {
              startTime: toolResult.startTime || Date.now(),
              endTime: toolResult.endTime || Date.now(),
              durationMs: toolResult.durationMs || 0,
            },
            timestamp: Date.now(),
          };
          yield toolCompleteEvent;
        }
```

- [ ] **Step 7: 循环结束后收尾最后的文本块，并改用 parts 落库**

把"Store final message"段（`chatService.ts:358-378`）替换为：

```ts
      // 收尾仍打开的文本块
      if (openTextBlockId) {
        const endedId = closeTextBlock() as string;
        const textEnd: TextEndEvent = {
          type: 'text_end',
          blockId: endedId,
          timestamp: Date.now(),
        };
        yield textEnd;
      }

      // content 兼容字段 = 所有文本块拼接
      const flatContent = parts
        .filter((p): p is Extract<MessagePart, { type: 'text' }> => p.type === 'text')
        .map(p => p.content)
        .join('');

      // 从 parts 还原 toolCalls/toolResults（向后兼容旧消费方）
      const flatToolCalls: ToolCall[] = parts
        .filter((p): p is Extract<MessagePart, { type: 'tool' }> => p.type === 'tool')
        .map(p => ({ id: p.id, name: p.name, input: p.input, startTime: p.startTime, endTime: p.endTime, durationMs: p.durationMs, result: p.result, isError: p.isError }));
      const flatToolResults: ToolResult[] = parts
        .filter((p): p is Extract<MessagePart, { type: 'tool' }> => p.type === 'tool')
        .map(p => ({ toolCallId: p.id, output: p.result, isError: p.isError || false, startTime: p.startTime, endTime: p.endTime, durationMs: p.durationMs }));

      await this.storeMessage({
        sessionId,
        role: 'assistant',
        content: flatContent,
        toolCalls: flatToolCalls.length > 0 ? flatToolCalls : undefined,
        toolResults: flatToolResults.length > 0 ? flatToolResults : undefined,
        parts,
        tokensUsed: totalTokens,
      });
```

> 这样删除了原先 `finalContent`/`finalToolCalls = iterationToolCalls`（覆盖 bug）的落库路径。若 `finalContent`/`finalToolCalls`/`finalToolResults` 变量在后续 `message_complete` 的 metadata（`toolCallsCount: finalToolCalls.length`）仍被引用，将其改为 `parts.filter(p => p.type === 'tool').length`。

- [ ] **Step 8: 修正 message_complete 的 toolCallsCount 引用**

把 `message_complete` 事件（`chatService.ts:397-407`）的 metadata 改为基于 parts：

```ts
        metadata: {
          totalTokens,
          toolCallsCount: parts.filter(p => p.type === 'tool').length,
          durationMs: endTime - startTime,
        },
```

并移除不再使用的 `finalContent` / `finalToolCalls` / `finalToolResults` 声明（`chatService.ts:215-217`），消除未使用变量告警。保留 `totalTokens`/`totalInputTokens`/`totalOutputTokens`/`startTime`。

- [ ] **Step 9: 确认 TextStartEvent/TextEndEvent 已导入**

在 `chatService.ts` 顶部 SSE 事件导入处，补上 `TextStartEvent, TextEndEvent`（与现有 `ContentDeltaEvent`/`ToolStartEvent` 等同一条 import）。

- [ ] **Step 10: 跑测试确认通过**

Run: `cd backend && npx vitest run tests/chatService.test.ts -t "时序分段"`
Expected: PASS（两个用例）。

- [ ] **Step 11: 跑全量后端测试 + 编译**

Run: `cd backend && npx vitest run && npx tsc --noEmit`
Expected: 全绿、无类型错误（content_delta 的 blockId 在后端已补齐）。

- [ ] **Step 12: Commit**

```bash
git add backend/src/services/chatService.ts backend/tests/chatService.test.ts
git commit -m "feat(chat): streamMessage 按时序构建 parts 并发出文本块边界事件，修复多轮工具覆盖"
```

---

## Task 5: 后端 chat.ts 返回 parts

**Files:**
- Modify: `backend/src/routes/chat.ts:215-226`
- Test: `backend/tests/chat.api.test.ts`

- [ ] **Step 1: 写失败测试 —— GET messages 透传 parts**

在 `backend/tests/chat.api.test.ts` 适当 describe 内追加（沿用该文件已有的 app/supertest 与建表辅助；若文件已有 `seedSession`/`request(app)` 风格，复用之）：

```ts
it('GET /sessions/:id/messages 返回消息 parts', async () => {
  // 直接插入一条带 parts 的 assistant 消息
  const sessionId = randomUUID();
  await db.insert(chatSessions).values({
    id: sessionId, title: null, userId: null, contextSummary: null, createdAt: Date.now(), updatedAt: null,
  });
  await db.insert(chatMessages).values({
    id: randomUUID(), sessionId, role: 'assistant', content: 'ab',
    toolCalls: null, toolResults: null,
    parts: JSON.stringify([
      { type: 'text', id: 'b1', content: 'a' },
      { type: 'tool', id: 't1', name: 'searchProducts', input: {}, result: { ok: 1 }, isError: false },
      { type: 'text', id: 'b2', content: 'b' },
    ]),
    tokensUsed: null, timestamp: Date.now(),
  });

  const res = await request(app).get(`/api/chat/sessions/${sessionId}/messages`);
  expect(res.status).toBe(200);
  expect(res.body.messages[0].parts.map((p: { type: string }) => p.type)).toEqual(['text', 'tool', 'text']);
});
```

> 若 `chat.api.test.ts` 顶部未导入 `randomUUID`/`db`/`chatSessions`/`chatMessages`，按该文件现有导入风格补上。

- [ ] **Step 2: 跑测试确认失败**

Run: `cd backend && npx vitest run tests/chat.api.test.ts -t "返回消息 parts"`
Expected: FAIL —— 返回的 message 无 `parts`。

- [ ] **Step 3: 路由解析 parts**

在 `backend/src/routes/chat.ts` 的 `GET /sessions/:id/messages` 处理里，把 `parsed` 映射（`chat.ts:215-224`）补上 parts：

```ts
    const parsed = messages.map((msg) => ({
      id: msg.id,
      sessionId: msg.sessionId,
      role: msg.role,
      content: msg.content,
      toolCalls: msg.toolCalls ? JSON.parse(msg.toolCalls) as Array<{ id: string; name: string; input: Record<string, unknown> }> : undefined,
      toolResults: msg.toolResults ? JSON.parse(msg.toolResults) as Array<{ toolCallId: string; output: unknown; isError: boolean }> : undefined,
      parts: msg.parts ? JSON.parse(msg.parts) as import('../../../shared/types/sse-protocol').MessagePart[] : undefined,
      tokensUsed: msg.tokensUsed,
      timestamp: msg.timestamp,
    }));
```

- [ ] **Step 4: 跑测试确认通过 + 全量 API 测试**

Run: `cd backend && npx vitest run tests/chat.api.test.ts`
Expected: PASS（含新用例）。

- [ ] **Step 5: Commit**

```bash
git add backend/src/routes/chat.ts backend/tests/chat.api.test.ts
git commit -m "feat(chat): GET messages 透传消息 parts"
```

---

## Task 6: 前端类型与 store parts actions

**Files:**
- Modify: `frontend/src/types/chat.ts`
- Modify: `frontend/src/stores/chatStore.ts`
- Test: `frontend/src/stores/chatStore.test.ts`（新建）

- [ ] **Step 1: 前端新增 MessagePart 类型并扩展 ChatMessage**

在 `frontend/src/types/chat.ts` 末尾新增：

```ts
/**
 * 消息内容块（与后端 shared/types/sse-protocol 的 MessagePart 对齐）
 */
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

并给该文件中的 `ChatMessage` 接口加一行：

```ts
  parts?: MessagePart[];
```

- [ ] **Step 2: store 的 ChatMessage 与 state 类型加 parts 与 actions 声明**

在 `frontend/src/stores/chatStore.ts`：

(a) `import` 处加入 `MessagePart`：
```ts
import type { ToolCall, ToolResult, TokenUsage, ToolExecutionState, TaskOverview, MessagePart } from '../types/chat';
```

(b) 给本文件的 `ChatMessage` 接口加字段：
```ts
  parts?: MessagePart[];
```

(c) 在 `ChatState` 接口的 actions 区追加声明：
```ts
  startTextBlock: (blockId: string) => void;
  appendTextBlock: (blockId: string, delta: string) => void;
  endTextBlock: (blockId: string) => void;
  appendToolPart: (part: Extract<MessagePart, { type: 'tool' }>) => void;
  completeToolPart: (toolId: string, patch: { result?: unknown; isError?: boolean; startTime?: number; endTime?: number; durationMs?: number }) => void;
```

- [ ] **Step 3: 写失败测试 —— parts actions 构建有序块**

新建 `frontend/src/stores/chatStore.test.ts`：

```ts
import { describe, it, expect, beforeEach } from 'vitest';
import { useChatStore } from './chatStore';
import type { ChatMessage } from './chatStore';

function seedAssistant() {
  const msg: ChatMessage = { id: 'm1', role: 'assistant', content: '', parts: [], timestamp: 1 };
  useChatStore.getState().setMessages([msg]);
}

describe('chatStore parts actions', () => {
  beforeEach(() => useChatStore.getState().reset());

  it('文本→工具→文本 构建有序 parts', () => {
    seedAssistant();
    const s = useChatStore.getState();
    s.startTextBlock('b1');
    s.appendTextBlock('b1', '先说');
    s.appendTextBlock('b1', '一段');
    s.endTextBlock('b1');
    s.appendToolPart({ type: 'tool', id: 't1', name: 'searchProducts', input: { q: 'x' } });
    s.completeToolPart('t1', { result: { ok: 1 }, isError: false, durationMs: 9 });
    s.startTextBlock('b2');
    s.appendTextBlock('b2', '再说一段');
    s.endTextBlock('b2');

    const parts = useChatStore.getState().messages[0].parts!;
    expect(parts.map(p => p.type)).toEqual(['text', 'tool', 'text']);
    expect(parts[0]).toMatchObject({ type: 'text', content: '先说一段' });
    expect(parts[1]).toMatchObject({ type: 'tool', id: 't1', result: { ok: 1 }, durationMs: 9 });
    expect(parts[2]).toMatchObject({ type: 'text', content: '再说一段' });
    // content 兼容字段同步为文本拼接
    expect(useChatStore.getState().messages[0].content).toBe('先说一段再说一段');
  });

  it('appendTextBlock 对未知 blockId 容错创建', () => {
    seedAssistant();
    const s = useChatStore.getState();
    s.appendTextBlock('bx', 'hi');
    const parts = useChatStore.getState().messages[0].parts!;
    expect(parts).toHaveLength(1);
    expect(parts[0]).toMatchObject({ type: 'text', id: 'bx', content: 'hi' });
  });
});
```

- [ ] **Step 4: 跑测试确认失败**

Run: `cd frontend && npx vitest run src/stores/chatStore.test.ts`
Expected: FAIL —— actions 未实现（`s.startTextBlock is not a function`）。

- [ ] **Step 5: 实现 parts actions**

在 `frontend/src/stores/chatStore.ts` 的 store 实现里（与其它 actions 并列，如 `appendToLastMessage` 附近）加入。每个 action 都对"最后一条消息"做不可变更新：

```ts
      startTextBlock: (blockId) =>
        set((state) => {
          const messages = [...state.messages];
          const i = messages.length - 1;
          if (i < 0) return {};
          const parts = [...(messages[i].parts || [])];
          if (!parts.some((p) => p.type === 'text' && p.id === blockId)) {
            parts.push({ type: 'text', id: blockId, content: '' });
          }
          messages[i] = { ...messages[i], parts };
          return { messages };
        }),

      appendTextBlock: (blockId, delta) =>
        set((state) => {
          const messages = [...state.messages];
          const i = messages.length - 1;
          if (i < 0) return {};
          const parts = [...(messages[i].parts || [])];
          let idx = parts.findIndex((p) => p.type === 'text' && p.id === blockId);
          if (idx === -1) {
            parts.push({ type: 'text', id: blockId, content: '' });
            idx = parts.length - 1;
          }
          const part = parts[idx];
          if (part.type === 'text') {
            parts[idx] = { ...part, content: part.content + delta };
          }
          messages[i] = {
            ...messages[i],
            parts,
            content: (messages[i].content || '') + delta,
          };
          return { messages };
        }),

      endTextBlock: () => {
        // 文本块边界标记；当前无需额外状态变更（保留以备未来 UI 用途）
      },

      appendToolPart: (part) =>
        set((state) => {
          const messages = [...state.messages];
          const i = messages.length - 1;
          if (i < 0) return {};
          const parts = [...(messages[i].parts || []), part];
          messages[i] = { ...messages[i], parts };
          return { messages };
        }),

      completeToolPart: (toolId, patch) =>
        set((state) => {
          const messages = [...state.messages];
          const i = messages.length - 1;
          if (i < 0) return {};
          const parts = (messages[i].parts || []).map((p) =>
            p.type === 'tool' && p.id === toolId ? { ...p, ...patch } : p
          );
          messages[i] = { ...messages[i], parts };
          return { messages };
        }),
```

- [ ] **Step 6: 跑测试确认通过**

Run: `cd frontend && npx vitest run src/stores/chatStore.test.ts`
Expected: PASS（两个用例）。

- [ ] **Step 7: Commit**

```bash
git add frontend/src/types/chat.ts frontend/src/stores/chatStore.ts frontend/src/stores/chatStore.test.ts
git commit -m "feat(store): 新增消息 parts 类型与有序内容块 actions"
```

---

## Task 7: 前端 chatApi 与 useChatSSE 处理新事件

**Files:**
- Modify: `frontend/src/services/chatApi.ts:111-126`（handlers 接口）、事件 switch
- Modify: `frontend/src/hooks/useChatSSE.ts`

- [ ] **Step 1: chatApi 的 SSEEventHandlers 增加文本块回调，content_delta 带 blockId**

在 `frontend/src/services/chatApi.ts` 的 `SSEEventHandlers` 接口中，把 `onTextDelta` 改为带 blockId，并新增起止回调：

```ts
  onTextStart?: (blockId: string) => void;
  onTextDelta?: (blockId: string, delta: string) => void;
  onTextEnd?: (blockId: string) => void;
```

- [ ] **Step 2: 导入新事件类型并在 switch 中处理**

(a) 顶部类型导入补上 `TextStartEvent, TextEndEvent`（与现有 `ContentDeltaEvent` 同一条 import）。

(b) 把 `content_delta` case 改为传 blockId：
```ts
            case 'content_delta': {
              const e = sseEvent as ContentDeltaEvent;
              handlers.onTextDelta?.(e.blockId, e.delta);
              break;
            }
```

(c) 在 `content_delta` case 后新增两个 case：
```ts
            case 'text_start': {
              const e = sseEvent as TextStartEvent;
              handlers.onTextStart?.(e.blockId);
              break;
            }

            case 'text_end': {
              const e = sseEvent as TextEndEvent;
              handlers.onTextEnd?.(e.blockId);
              break;
            }
```

- [ ] **Step 3: useChatSSE 接入新回调，工具事件改为操作 parts**

在 `frontend/src/hooks/useChatSSE.ts`：

(a) 从 store 解构新增 actions：
```ts
    startTextBlock,
    appendTextBlock,
    endTextBlock,
    appendToolPart,
    completeToolPart,
```
（加入现有 `const { … } = useChatStore();` 解构，并加入 `sendMessage` 的 `useCallback` 依赖数组。）

(b) 把 handlers 里的文本与工具回调替换为：
```ts
          // Event: text_start
          onTextStart: (blockId: string) => {
            startTextBlock(blockId);
          },

          // Event: content_delta
          onTextDelta: (blockId: string, delta: string) => {
            appendTextBlock(blockId, delta);
          },

          // Event: text_end
          onTextEnd: (blockId: string) => {
            endTextBlock(blockId);
          },

          // Event: tool_start
          onToolCallStart: (toolCall: ToolCall) => {
            appendToolPart({
              type: 'tool',
              id: toolCall.id,
              name: toolCall.name,
              input: (toolCall.input ?? {}) as Record<string, unknown>,
              startTime: toolCall.startTime,
            });
          },

          // Event: tool_complete
          onToolResult: (result: ToolResult) => {
            completeToolPart(result.toolCallId, {
              result: result.output,
              isError: result.isError,
              endTime: result.endTime,
              durationMs: result.durationMs,
            });
          },
```

> 移除原先基于 `appendToLastMessage` / `updateLastMessage(toolCalls)` 的实现（content 已由 `appendTextBlock` 同步维护）。`onMessageStart` 创建 assistant 占位消息时，确保初始化 `parts: []`：在 `assistantMessage` 字面量加 `parts: [],`。

- [ ] **Step 4: 编译验证**

Run: `cd frontend && npx tsc --noEmit`
Expected: EXIT 0（无类型错误；`appendToLastMessage` 若不再使用，从解构中移除以免告警）。

- [ ] **Step 5: 跑既有前端测试**

Run: `cd frontend && npx vitest run`
Expected: 全绿（store 测试 + 既有测试）。

- [ ] **Step 6: Commit**

```bash
git add frontend/src/services/chatApi.ts frontend/src/hooks/useChatSSE.ts
git commit -m "feat(chat): 前端处理 text_start/text_end，流式按 parts 累积文本与工具"
```

---

## Task 8: 渲染 EnhancedMessageCard 按 parts + 工具卡默认收起 + 旧消息兼容

**Files:**
- Modify: `frontend/src/components/chat/EnhancedMessageCard.tsx:98-263`
- Modify: `frontend/src/components/chat/ToolExecutionCard.tsx:51`
- Modify: `frontend/src/stores/chatStore.ts`（`loadMessages` 兼容合成）
- Test: `frontend/src/components/chat/EnhancedMessageCard.test.tsx`（新建）

- [ ] **Step 1: 工具卡默认收起**

`frontend/src/components/chat/ToolExecutionCard.tsx:51`：

```ts
  const [isExpanded, setIsExpanded] = useState(false);
```

- [ ] **Step 2: loadMessages 兼容合成 parts（旧消息读时转换）**

在 `frontend/src/stores/chatStore.ts` 的 `loadMessages` 里，把每条 message 映射时补上 parts 合成。将其 `.map((msg) => ({ … }))` 改为：

```ts
          const messages = response.messages.map((msg) => {
            const parts: MessagePart[] =
              msg.parts && msg.parts.length > 0
                ? msg.parts
                : [
                    ...(msg.content ? [{ type: 'text' as const, id: `${msg.id}-text`, content: msg.content }] : []),
                    ...((msg.toolCalls || []).map((tc) => ({
                      type: 'tool' as const,
                      id: tc.id,
                      name: tc.name,
                      input: (tc.input ?? {}) as Record<string, unknown>,
                      result: tc.result,
                      isError: tc.isError,
                      durationMs: tc.durationMs,
                    }))),
                  ];
            return {
              id: msg.id,
              sessionId: msg.sessionId,
              role: msg.role,
              content: msg.content,
              toolCalls: msg.toolCalls,
              toolResults: msg.toolResults,
              parts,
              tokensUsed: msg.tokensUsed,
              timestamp: msg.timestamp,
            };
          });
```

> 前置：`chatApi.ts` 的 `GetMessagesResponse`（`chatApi.ts:62-81`）的 message 元素当前**不含** `parts`。先在该接口的 message 元素类型里加 `parts?: MessagePart[];`，并在 `chatApi.ts` 顶部从 `../types/chat` 导入 `MessagePart`，否则上面的 `msg.parts` 访问会报类型错误。

- [ ] **Step 3: 写失败测试 —— 按 parts 顺序渲染**

新建 `frontend/src/components/chat/EnhancedMessageCard.test.tsx`：

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { EnhancedMessageCard } from './EnhancedMessageCard';
import type { ChatMessage } from '@/types/chat';

describe('EnhancedMessageCard parts 渲染', () => {
  it('按 parts 顺序渲染文本-工具-文本', () => {
    const message: ChatMessage = {
      id: 'm1',
      role: 'assistant',
      content: '段一段二',
      timestamp: 1,
      parts: [
        { type: 'text', id: 'b1', content: '段一' },
        { type: 'tool', id: 't1', name: 'searchProducts', input: {}, result: { ok: 1 }, isError: false },
        { type: 'text', id: 'b2', content: '段二' },
      ],
    };
    const { container } = render(<EnhancedMessageCard message={message} />);

    expect(screen.getByText('段一')).toBeInTheDocument();
    expect(screen.getByText('段二')).toBeInTheDocument();

    // 顺序：段一 在 工具卡(#tool-t1) 之前，段二 在其之后
    const html = container.innerHTML;
    expect(html.indexOf('段一')).toBeLessThan(html.indexOf('tool-t1'));
    expect(html.indexOf('tool-t1')).toBeLessThan(html.indexOf('段二'));
  });

  it('工具卡默认收起（不渲染“输入/结果”详情）', () => {
    const message: ChatMessage = {
      id: 'm2', role: 'assistant', content: '', timestamp: 1,
      parts: [{ type: 'tool', id: 't1', name: 'searchProducts', input: { q: 'x' }, result: { ok: 1 }, isError: false }],
    };
    render(<EnhancedMessageCard message={message} />);
    expect(screen.queryByText('输入')).not.toBeInTheDocument();
  });
});
```

> 测试环境需 jsdom 与 jest-dom matchers。若仓库尚无 vitest setup，新建 `frontend/vitest.setup.ts` 写入 `import '@testing-library/jest-dom';`，并在 `frontend/vite.config.ts` 的 `test` 配置加 `environment: 'jsdom'` 与 `setupFiles: ['./vitest.setup.ts']`（若已存在则跳过本注释）。

- [ ] **Step 4: 跑测试确认失败**

Run: `cd frontend && npx vitest run src/components/chat/EnhancedMessageCard.test.tsx`
Expected: FAIL —— 当前组件渲染整块 content + 底部 toolCalls，顺序断言不成立。

- [ ] **Step 5: 抽出文本渲染为子组件**

在 `EnhancedMessageCard.tsx` 顶部（组件外）新增一个文本渲染子组件，把现有 `ReactMarkdown` 及其 `components={{…}}` 配置原样搬入（避免重复，集中维护）：

```tsx
const MarkdownText: React.FC<{ children: string }> = ({ children }) => (
  <div className="prose prose-sm max-w-none">
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
      {children}
    </ReactMarkdown>
  </div>
);
```

把原 inline 的 `components={{ code, a, table, … }}` 对象提取为模块级常量 `markdownComponents`（内容与现有完全一致，仅迁移位置）。

- [ ] **Step 6: 用 parts 顺序渲染替换正文区**

把 assistant 卡片内"消息内容"块（`EnhancedMessageCard.tsx:98-263`，即原 `prose` 容器、`taskSummary`、`structuredQuestions`、`message.toolCalls` 那段）替换为按 parts 渲染；无 parts 时回退：

```tsx
            {/* 正文：按内容块顺序渲染 */}
            {message.parts && message.parts.length > 0 ? (
              <div className="space-y-3">
                {message.parts.map((part) =>
                  part.type === 'text' ? (
                    <MarkdownText key={part.id}>{part.content}</MarkdownText>
                  ) : (
                    <ToolExecutionCard
                      key={part.id}
                      toolCall={{
                        id: part.id,
                        name: part.name,
                        input: part.input,
                        result: part.result,
                        isError: part.isError,
                        startTime: part.startTime,
                        endTime: part.endTime,
                        durationMs: part.durationMs,
                      }}
                      isRunning={isStreaming && part.result === undefined}
                    />
                  )
                )}
              </div>
            ) : (
              // 向后兼容：无 parts 的旧消息
              <>
                <MarkdownText>{message.content}</MarkdownText>
                {message.toolCalls && message.toolCalls.length > 0 && (
                  <div className="mt-4 space-y-3">
                    {message.toolCalls.map((toolCall) => (
                      <ToolExecutionCard
                        key={toolCall.id}
                        toolCall={toolCall}
                        isRunning={isStreaming && agentStatus === 'tool_calling'}
                      />
                    ))}
                  </div>
                )}
              </>
            )}

            {message.taskSummary && (
              <TaskSummaryBlock
                title={message.taskSummary.title}
                content={message.taskSummary.description}
              />
            )}

            {structuredQuestions && structuredQuestions.length > 0 && (
              <NumberedQuestionList questions={structuredQuestions} />
            )}
```

- [ ] **Step 7: 跑测试确认通过**

Run: `cd frontend && npx vitest run src/components/chat/EnhancedMessageCard.test.tsx`
Expected: PASS（两个用例）。

- [ ] **Step 8: 全量前端测试 + 编译**

Run: `cd frontend && npx vitest run && npx tsc --noEmit`
Expected: 全绿、EXIT 0。

- [ ] **Step 9: Commit**

```bash
git add frontend/src/components/chat/EnhancedMessageCard.tsx frontend/src/components/chat/ToolExecutionCard.tsx frontend/src/stores/chatStore.ts frontend/src/components/chat/EnhancedMessageCard.test.tsx frontend/vitest.setup.ts frontend/vite.config.ts
git commit -m "feat(chat): 消息按内容块时序渲染，工具卡默认收起，旧消息读时兼容"
```

---

## Task 9: 端到端验证（Playwright 手动驱动）

**Files:** 无（验证步骤）

- [ ] **Step 1: 确认前后端服务在运行**

前端 dev（3000）、后端（3001）均在运行。数据库迁移已应用（Task 2）。

- [ ] **Step 2: 打开 chat 并发送会触发工具的消息**

```bash
cd "D:/学习/AI运营" && playwright-cli open "http://localhost:3000/chat"
playwright-cli fill 'textarea[name="message"]' "帮我搜索亚马逊上的蓝牙耳机并分析价格"
playwright-cli press Enter
```

- [ ] **Step 3: 验证时序分段与默认收起**

Run: `playwright-cli --raw snapshot`
Expected：assistant 消息内出现"文本段 → 工具卡 →（若有）文本段"的先后结构；工具卡处于收起态（只见标题行与状态 chip，无"输入/结果"两列）。

```bash
playwright-cli console error
```
Expected: 无 React key 重复等报错。

- [ ] **Step 4: 验证展开与历史回看**

点击工具卡展开按钮，确认能展开输入/结果；刷新页面后该会话消息仍按相同时序分段显示（持久化生效）。

```bash
playwright-cli reload
playwright-cli --raw snapshot
```
Expected: 分段结构与刷新前一致。

- [ ] **Step 5: 收尾**

```bash
playwright-cli close
```

---

## 自检清单（实现完成后逐项确认）

- [ ] SSE：`text_start` / `text_end` / `content_delta(blockId)` 三事件齐全且联合类型已更新
- [ ] 后端：streamMessage 按时序产出 parts，多轮工具全部保留，content 为文本拼接
- [ ] 存储：`chat_messages.parts` 列存在，读写正确
- [ ] 前端：store actions 容错；useChatSSE 接入；渲染按序；工具卡默认收起；旧消息回退
- [ ] 测试：后端 chatService/chat.api、前端 store/组件 全绿；tsc 无错
- [ ] E2E：分段、收起、刷新持久化 三项目视验证通过
